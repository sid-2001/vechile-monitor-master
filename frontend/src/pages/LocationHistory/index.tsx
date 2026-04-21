import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import DownloadIcon from '@mui/icons-material/Download'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import 'leaflet/dist/leaflet.css'

type VehicleOption = { _id: string; vehicleNumber: string }
type BucketType = 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'

type TimelinePoint = {
  _id: string
  vehicleId: string
  vehicleNumber: string
  latitude: number
  longitude: number
  speed: number
  time: string
  bucketTime: string
}

const vehicleColors = ['#FFDE42', '#42A5F5', '#66BB6A', '#EF5350', '#AB47BC', '#FFA726', '#26C6DA', '#8D6E63']

const bucketByZoom = (zoom: number): BucketType => {
  if (zoom < 7) return 'month'
  if (zoom < 9) return 'week'
  if (zoom < 11) return 'day'
  if (zoom < 13) return 'hour'
  if (zoom < 16) return 'minute'
  return 'second'
}

const bucketLabelMap: Record<BucketType, string> = {
  month: 'Monthly',
  week: 'Weekly',
  day: 'Day wise',
  hour: 'Hourly',
  minute: 'Minute wise',
  second: '5-second wise',
}

const getBinSizeByZoom = (zoom: number) => (zoom >= 16 ? 5 : 1)

const toInputDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const HISTORY_WINDOW_HOURS = 24
const HISTORY_WINDOW_MS = HISTORY_WINDOW_HOURS * 60 * 60 * 1000

const LocationHistory = () => {
  const now = new Date()
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [fromDate, setFromDate] = useState(toInputDate(new Date(now.getTime() - HISTORY_WINDOW_MS)))
  const [toDate, setToDate] = useState(toInputDate(now))
  const [zoomLevel, setZoomLevel] = useState(7)
  const [bucket, setBucket] = useState<BucketType>('month')
  const [points, setPoints] = useState<TimelinePoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [binSize, setBinSize] = useState(1)

  const zoomLoadTimer = useRef<number | null>(null)

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await vehicleMonitorService.getVehicles()
        setVehicles(data.items || [])
      } catch (e: any) {
        setError(e?.error_message || 'Unable to load vehicles')
      }
    }
    loadVehicles()
  }, [])

  const loadTimeline = async (overrideBucket?: BucketType) => {
    if (!selectedVehicleIds.length) {
      setError('Please select at least one vehicle')
      return
    }

    const activeBucket = overrideBucket || bucket
    const activeBinSize = activeBucket === 'second' ? getBinSizeByZoom(zoomLevel) : 1

    try {
      setLoading(true)
      setError('')
      const from = new Date(fromDate)
      const to = new Date(toDate)

      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        setError('Please select valid From/To date-time')
        return
      }
      if (from > to) {
        setError('From date must be before To date')
        return
      }
      if (to.getTime() - from.getTime() > HISTORY_WINDOW_MS) {
        setError(`History range cannot exceed ${HISTORY_WINDOW_HOURS} hours`)
        return
      }

      const data = await vehicleMonitorService.getVehicleTimeline({
        vehicleIds: selectedVehicleIds.join(','),
        from: from.toISOString(),
        to: to.toISOString(),
        bucket: activeBucket,
        binSize: activeBinSize,
        excludeSimulation: true,
      })
      setPoints(data.items || [])
      setBucket(activeBucket)
      setBinSize(activeBinSize)
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load timeline data')
    } finally {
      setLoading(false)
    }
  }

  const onVehicleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    const ids = typeof value === 'string' ? value.split(',') : value
    setSelectedVehicleIds(ids)
  }

  const handleFromDateChange = (value: string) => {
    const nextFrom = new Date(value)
    const currentTo = new Date(toDate)
    if (Number.isNaN(nextFrom.getTime())) {
      setFromDate(value)
      return
    }

    let normalizedTo = currentTo
    if (nextFrom > currentTo) {
      normalizedTo = new Date(nextFrom.getTime() + HISTORY_WINDOW_MS)
    }

    if (normalizedTo.getTime() - nextFrom.getTime() > HISTORY_WINDOW_MS) {
      normalizedTo = new Date(nextFrom.getTime() + HISTORY_WINDOW_MS)
    }

    setFromDate(value)
    setToDate(toInputDate(normalizedTo))
  }

  const handleToDateChange = (value: string) => {
    const nextTo = new Date(value)
    const currentFrom = new Date(fromDate)
    if (Number.isNaN(nextTo.getTime())) {
      setToDate(value)
      return
    }

    let normalizedFrom = currentFrom
    if (currentFrom > nextTo) {
      normalizedFrom = new Date(nextTo.getTime() - HISTORY_WINDOW_MS)
    }

    if (nextTo.getTime() - normalizedFrom.getTime() > HISTORY_WINDOW_MS) {
      normalizedFrom = new Date(nextTo.getTime() - HISTORY_WINDOW_MS)
    }

    setFromDate(toInputDate(normalizedFrom))
    setToDate(value)
  }

  const mapCenter = useMemo<[number, number]>(() => {
    if (!points.length) return [22.9734, 78.6569]
    return [points[0].latitude, points[0].longitude]
  }, [points])

  const vehicleColorMap = useMemo(() => {
    const map = new Map<string, string>()
    selectedVehicleIds.forEach((id, index) => map.set(id, vehicleColors[index % vehicleColors.length]))
    return map
  }, [selectedVehicleIds])

  const ZoomTracker = () => {
    useMapEvents({
      zoomend: (event) => {
        const newZoom = event.target.getZoom()
        setZoomLevel(newZoom)

        const nextBucket = bucketByZoom(newZoom)
        if (nextBucket !== bucket) {
          if (zoomLoadTimer.current) window.clearTimeout(zoomLoadTimer.current)
          zoomLoadTimer.current = window.setTimeout(() => {
            loadTimeline(nextBucket)
          }, 350)
        }
      },
    })
    return null
  }

  const downloadCsv = () => {
    if (!points.length) return

    const header = 'vehicle,time,latitude,longitude,speed,bucketTime\n'
    const rows = points.map((point) => `${point.vehicleNumber},${new Date(point.time).toISOString()},${point.latitude},${point.longitude},${point.speed},${new Date(point.bucketTime).toISOString()}`).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `location-history-${bucket}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const mapElement = (
    <Box sx={{ height: 540, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }} />}
      <MapContainer center={mapCenter} zoom={zoomLevel} preferCanvas style={{ height: '100%', width: '100%' }}>
        <ZoomTracker />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

        {points.map((point, idx) => (
          <CircleMarker
            key={`${point._id}-${idx}`}
            center={[point.latitude, point.longitude]}
            radius={3}
            pathOptions={{
              color: vehicleColorMap.get(point.vehicleId) || '#FFDE42',
              fillColor: vehicleColorMap.get(point.vehicleId) || '#FFDE42',
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <Stack spacing={0.5}>
                <Typography variant='body2'><strong>Vehicle:</strong> {point.vehicleNumber}</Typography>
                <Typography variant='body2'><strong>Time:</strong> {new Date(point.time).toLocaleString()}</Typography>
                <Typography variant='body2'><strong>Speed:</strong> {point.speed} km/h</Typography>
              </Stack>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  )

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Adaptive Million-Point Mode)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id='vehicle-multi-label'>Vehicles</InputLabel>
                <Select
                  labelId='vehicle-multi-label'
                  multiple
                  value={selectedVehicleIds}
                  onChange={onVehicleChange}
                  label='Vehicles'
                  renderValue={(selected) => (selected as string[])
                    .map((id) => vehicles.find((v) => v._id === id)?.vehicleNumber || id)
                    .join(', ')}
                >
                  {vehicles.map((vehicle) => <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='datetime-local'
                label='From'
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: toDate,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='datetime-local'
                label='To'
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: fromDate,
                  max: toInputDate(new Date()),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button fullWidth variant='contained' onClick={() => loadTimeline('month')} sx={{ height: 56 }} disabled={loading}>Load History</Button>
            </Grid>

            <Grid item xs={12} md={2}>
              <Stack direction='row' justifyContent='flex-end' spacing={1}>
                <Button variant='outlined' startIcon={<DownloadIcon />} onClick={downloadCsv} disabled={!points.length}>CSV</Button>
                <IconButton onClick={() => setFullscreenOpen(true)}><FullscreenIcon /></IconButton>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction='row' spacing={1} mt={2} flexWrap='wrap'>
            <Chip color='warning' label='Range limited to last 24 hours' />
            <Chip color='primary' label={`Current loading level: ${bucketLabelMap[bucket]}${bucket === "second" ? ` (${binSize}s)` : ""}`} />
            <Chip label={`Zoom: ${zoomLevel}`} />
            <Chip label={`Loaded points: ${points.length.toLocaleString()}`} />
            <Chip label='Flow: Month → Week → Day → Hour → Minute → Second' />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={12}><Card><CardContent>{mapElement}</CardContent></Card></Grid>
     
      </Grid>

      <Dialog fullScreen open={fullscreenOpen} onClose={() => setFullscreenOpen(false)}>
        <DialogContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='h6'>Location History Map</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {mapElement}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default LocationHistory
