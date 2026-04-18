import { useEffect, useMemo, useState } from 'react'
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

type RawLocationPoint = {
  _id: string
  vehicleId: string
  vehicleNumber: string
  latitude: number
  longitude: number
  speed: number
  time: string
}

type TimePreset = '12h' | '6h' | '1h'

const vehicleColors = ['#FFDE42', '#42A5F5', '#66BB6A', '#EF5350', '#AB47BC', '#FFA726', '#26C6DA', '#8D6E63']

const getPresetRange = (preset: TimePreset) => {
  const end = new Date()
  const start = new Date(end)

  if (preset === '12h') start.setHours(end.getHours() - 12)
  if (preset === '6h') start.setHours(end.getHours() - 6)
  if (preset === '1h') start.setHours(end.getHours() - 1)

  return { from: start.toISOString(), to: end.toISOString() }
}

const getBucketMsFromZoom = (zoom: number) => {
  if (zoom < 7) return 12 * 60 * 60 * 1000
  if (zoom < 9) return 6 * 60 * 60 * 1000
  if (zoom < 11) return 60 * 60 * 1000
  if (zoom < 13) return 30 * 60 * 1000
  if (zoom < 15) return 10 * 60 * 1000
  if (zoom < 17) return 60 * 1000
  return 1000
}

const formatBucketLabel = (bucketMs: number) => {
  if (bucketMs >= 12 * 60 * 60 * 1000) return '12 hour points'
  if (bucketMs >= 6 * 60 * 60 * 1000) return '6 hour points'
  if (bucketMs >= 60 * 60 * 1000) return '1 hour points'
  if (bucketMs >= 30 * 60 * 1000) return '30 minute points'
  if (bucketMs >= 10 * 60 * 1000) return '10 minute points'
  if (bucketMs >= 60 * 1000) return '1 minute points'
  return '1 second points'
}

const LocationHistory = () => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [timePreset, setTimePreset] = useState<TimePreset>('12h')
  const [points, setPoints] = useState<RawLocationPoint[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(8)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

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

  const fetchHistory = async (preset: TimePreset = timePreset, vehicleIds: string[] = selectedVehicleIds) => {
    if (!vehicleIds.length) {
      setError('Please select at least one vehicle')
      return
    }

    try {
      setLoading(true)
      setError('')

      const { from, to } = getPresetRange(preset)
      const vehicleMap = new Map(vehicles.map((v) => [v._id, v.vehicleNumber]))

      const allResponses = await Promise.all(
        vehicleIds.map(async (vehicleId) => {
          const response = await vehicleMonitorService.getVehicleLocations({
            vehicleId,
            from,
            to,
            limit: 20000,
            sortBy: 'time',
            sortOrder: 'asc',
          })
          return (response.items || []).map((item: any) => ({
            _id: item._id,
            vehicleId,
            vehicleNumber: vehicleMap.get(vehicleId) || vehicleId,
            latitude: item.latitude,
            longitude: item.longitude,
            speed: item.speed,
            time: item.time,
          }))
        })
      )

      setPoints(allResponses.flat())
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load location history')
    } finally {
      setLoading(false)
    }
  }

  const onVehicleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    const ids = typeof value === 'string' ? value.split(',') : value
    setSelectedVehicleIds(ids)
  }

  const onPresetChange = async (event: SelectChangeEvent<TimePreset>) => {
    const preset = event.target.value as TimePreset
    setTimePreset(preset)
    if (selectedVehicleIds.length) {
      await fetchHistory(preset, selectedVehicleIds)
    }
  }

  const groupedByVehicle = useMemo(() => {
    const byVehicle = new Map<string, RawLocationPoint[]>()
    for (const point of points) {
      if (!byVehicle.has(point.vehicleId)) byVehicle.set(point.vehicleId, [])
      byVehicle.get(point.vehicleId)?.push(point)
    }
    return byVehicle
  }, [points])

  const bucketMs = useMemo(() => getBucketMsFromZoom(zoomLevel), [zoomLevel])

  const visiblePoints = useMemo(() => {
    const rows: RawLocationPoint[] = []

    groupedByVehicle.forEach((vehiclePoints) => {
      const bucketMap = new Map<number, RawLocationPoint>()
      for (const point of vehiclePoints) {
        const t = new Date(point.time).getTime()
        const bucketKey = Math.floor(t / bucketMs) * bucketMs
        bucketMap.set(bucketKey, point)
      }
      rows.push(...Array.from(bucketMap.values()))
    })

    return rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [groupedByVehicle, bucketMs])

  const mapCenter = useMemo<[number, number]>(() => {
    if (visiblePoints.length > 0) return [visiblePoints[0].latitude, visiblePoints[0].longitude]
    return [22.9734, 78.6569]
  }, [visiblePoints])

  const vehicleColorMap = useMemo(() => {
    const map = new Map<string, string>()
    selectedVehicleIds.forEach((vehicleId, index) => {
      map.set(vehicleId, vehicleColors[index % vehicleColors.length])
    })
    return map
  }, [selectedVehicleIds])

  const ZoomTracker = () => {
    useMapEvents({
      zoomend: (event) => {
        setZoomLevel(event.target.getZoom())
      },
    })
    return null
  }

  const mapElement = (
    <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height: '100%', width: '100%' }}>
        <ZoomTracker />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {visiblePoints.map((point, idx) => (
          <CircleMarker
            key={`${point._id}-${idx}`}
            center={[point.latitude, point.longitude]}
            radius={4}
            pathOptions={{
              color: vehicleColorMap.get(point.vehicleId) || '#FFDE42',
              fillColor: vehicleColorMap.get(point.vehicleId) || '#FFDE42',
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <Stack spacing={0.5}>
                <Typography variant='body2'><strong>Vehicle:</strong> {point.vehicleNumber}</Typography>
                <Typography variant='body2'><strong>Time:</strong> {new Date(point.time).toLocaleString()}</Typography>
                <Typography variant='body2'><strong>Speed:</strong> {point.speed} km/h</Typography>
                <Typography variant='body2'><strong>Lat:</strong> {point.latitude.toFixed(6)}</Typography>
                <Typography variant='body2'><strong>Lng:</strong> {point.longitude.toFixed(6)}</Typography>
              </Stack>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  )

  const selectedVehicleDetails = useMemo(
    () => vehicles.filter((vehicle) => selectedVehicleIds.includes(vehicle._id)),
    [vehicles, selectedVehicleIds]
  )

  const downloadCsv = () => {
    if (!visiblePoints.length) return

    const csvHeader = 'vehicle,time,latitude,longitude,speed\n'
    const csvRows = visiblePoints
      .map((point) => `${point.vehicleNumber},${new Date(point.time).toISOString()},${point.latitude},${point.longitude},${point.speed}`)
      .join('\n')

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `location-history-${timePreset}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Multi Vehicle)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={5}>
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
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id='time-preset-label'>Preset</InputLabel>
                <Select labelId='time-preset-label' value={timePreset} label='Preset' onChange={onPresetChange}>
                  <MenuItem value='12h'>Last 12 Hours</MenuItem>
                  <MenuItem value='6h'>Last 6 Hours</MenuItem>
                  <MenuItem value='1h'>Last 1 Hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button fullWidth variant='contained' onClick={() => fetchHistory()} disabled={loading} sx={{ height: '56px' }}>
                {loading ? 'Loading...' : 'Load History'}
              </Button>
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack direction='row' justifyContent='flex-end' spacing={1}>
                <Button startIcon={<DownloadIcon />} variant='outlined' disabled={!visiblePoints.length} onClick={downloadCsv}>
                  Download CSV
                </Button>
                <IconButton onClick={() => setFullscreenOpen(true)}>
                  <FullscreenIcon />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>

          {loading && <LinearProgress sx={{ mt: 2 }} />}

          <Stack direction='row' spacing={1} mt={2} flexWrap='wrap'>
            <Chip label={`Visible resolution: ${formatBucketLabel(bucketMs)}`} color='primary' />
            <Chip label={`Zoom: ${zoomLevel}`} />
            <Chip label={`Visible points: ${visiblePoints.length.toLocaleString()}`} />
          </Stack>

          <Stack direction='row' spacing={1} mt={1} flexWrap='wrap'>
            {selectedVehicleDetails.map((vehicle) => (
              <Chip
                key={vehicle._id}
                label={vehicle.vehicleNumber}
                sx={{
                  bgcolor: vehicleColorMap.get(vehicle._id),
                  color: '#111',
                  fontWeight: 600,
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>{mapElement}</CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' mb={1}>History Summary</Typography>
              <Stack spacing={1}>
                <Typography variant='body2'>Selected Vehicles: {selectedVehicleIds.length}</Typography>
                <Typography variant='body2'>Total Raw Points: {points.length.toLocaleString()}</Typography>
                <Typography variant='body2'>Visible Points: {visiblePoints.length.toLocaleString()}</Typography>
                <Typography variant='body2'>Sampling: {formatBucketLabel(bucketMs)}</Typography>
                {points.length > 0 && (
                  <Typography variant='body2'>
                    Time Range: {new Date(points[0].time).toLocaleString()} to {new Date(points[points.length - 1].time).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
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
