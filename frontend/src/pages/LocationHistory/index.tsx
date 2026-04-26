import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

type VehicleOption = { _id: string; vehicleNumber: string }

type VectorPoint = {
  _id: string
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  angle: number
  direction: string
  time: string
}

type EventPoint = {
  _id: string
  latitude: number
  longitude: number
  speed: number
  time: string
  type: 'overspeed' | 'harsh-braking'
}

type DirectionVector = {
  _id: string
  from: [number, number]
  to: [number, number]
  vehicleId: string
  angle: number
  direction: string
  speed: number
  time: string
}

type MapTileState = { z: number; x: number; y: number }

type WorkerPayload = {
  points: VectorPoint[]
  directionVectors: DirectionVector[]
  overSpeed: EventPoint[]
  harshBraking: EventPoint[]
  rawCount: number
  sampledCount: number
}

const vehicleColors = ['#FFDE42', '#42A5F5', '#66BB6A', '#EF5350', '#AB47BC', '#FFA726', '#26C6DA', '#8D6E63']

const toInputDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const HISTORY_WINDOW_HOURS = 24
const HISTORY_WINDOW_MS = HISTORY_WINDOW_HOURS * 60 * 60 * 1000

const lngToTileX = (lng: number, z: number) => Math.floor(((lng + 180) / 360) * 2 ** z)
const latToTileY = (lat: number, z: number) => {
  const latRad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** z)
}

const sampleSecondsByZoom = (z: number) => {
  if (z <= 8) return 120
  if (z <= 11) return 30
  if (z <= 14) return 10
  return 1
}

const LocationHistory = () => {
  const now = new Date()
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [fromDate, setFromDate] = useState(toInputDate(new Date(now.getTime() - HISTORY_WINDOW_MS)))
  const [toDate, setToDate] = useState(toInputDate(now))
  const [zoomLevel, setZoomLevel] = useState(7)
  const [tileState, setTileState] = useState<MapTileState>({ z: 7, x: lngToTileX(78.6569, 7), y: latToTileY(22.9734, 7) })
  const [points, setPoints] = useState<VectorPoint[]>([])
  const [directionVectors, setDirectionVectors] = useState<DirectionVector[]>([])
  const [overspeedEvents, setOverspeedEvents] = useState<EventPoint[]>([])
  const [harshBrakingEvents, setHarshBrakingEvents] = useState<EventPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [rawPointCount, setRawPointCount] = useState(0)
  const [sampledPointCount, setSampledPointCount] = useState(0)

  const mapMoveTimer = useRef<number | null>(null)
  const requestSeqRef = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const responseCacheRef = useRef<Map<string, any>>(new Map())

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

  useEffect(() => {
    workerRef.current = new Worker(new URL('./dataWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current.onmessage = (event: MessageEvent<{ type: string; data: WorkerPayload }>) => {
      if (event.data?.type !== 'optimizedHistory') return
      const data = event.data.data
      setPoints(data.points || [])
      setDirectionVectors(data.directionVectors || [])
      setOverspeedEvents(data.overSpeed || [])
      setHarshBrakingEvents(data.harshBraking || [])
      setRawPointCount(data.rawCount || 0)
      setSampledPointCount(data.sampledCount || 0)
    }

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const optimizeAndSetData = useCallback((rawPoints: VectorPoint[], overSpeed: EventPoint[], harshBraking: EventPoint[], zoom: number) => {
    if (!workerRef.current) {
      setPoints(rawPoints)
      setOverspeedEvents(overSpeed)
      setHarshBrakingEvents(harshBraking)
      setRawPointCount(rawPoints.length)
      setSampledPointCount(rawPoints.length)
      setDirectionVectors([])
      return
    }

    workerRef.current.postMessage({
      type: 'optimizeHistory',
      points: rawPoints,
      overSpeed,
      harshBraking,
      zoom,
    })
  }, [])

  const loadVectorHistory = useCallback(async () => {
    if (!selectedVehicleIds.length) {
      setError('Please select at least one vehicle')
      return
    }

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

    const cacheKey = `${selectedVehicleIds.join(',')}|${from.toISOString()}|${to.toISOString()}|${tileState.z}/${tileState.x}/${tileState.y}`
    const cached = responseCacheRef.current.get(cacheKey)
    if (cached) {
      optimizeAndSetData(cached.points, cached.overSpeed, cached.harshBraking, tileState.z)
      return
    }

    requestSeqRef.current += 1
    const currentRequestId = requestSeqRef.current

    try {
      setLoading(true)
      setError('')

      const responses = await Promise.all(
        selectedVehicleIds.map((vehicleId) =>
          vehicleMonitorService.getVehicleVectorHistory(vehicleId, {
            from: from.toISOString(),
            to: to.toISOString(),
            z: tileState.z,
            x: tileState.x,
            y: tileState.y,
            sampleSeconds: sampleSecondsByZoom(tileState.z),
            limit: tileState.z <= 8 ? 2000 : tileState.z <= 12 ? 5000 : 8000,
          })
        )
      )

      if (currentRequestId !== requestSeqRef.current) return

      const mergedPoints = responses.flatMap((item: any) => item.features || []) as VectorPoint[]
      const mergedOverspeed = responses.flatMap((item: any) => item?.events?.overSpeed || []) as EventPoint[]
      const mergedHarsh = responses.flatMap((item: any) => item?.events?.harshBraking || []) as EventPoint[]

      const payload = {
        points: mergedPoints,
        overSpeed: mergedOverspeed,
        harshBraking: mergedHarsh,
      }

      responseCacheRef.current.set(cacheKey, payload)
      optimizeAndSetData(mergedPoints, mergedOverspeed, mergedHarsh, tileState.z)
    } catch (e: any) {
      if (currentRequestId !== requestSeqRef.current) return
      setError(e?.error_message || 'Failed to load vector tile history')
    } finally {
      if (currentRequestId === requestSeqRef.current) {
        setLoading(false)
      }
    }
  }, [fromDate, optimizeAndSetData, selectedVehicleIds, tileState.x, tileState.y, tileState.z, toDate])

  const onVehicleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    const ids = typeof value === 'string' ? value.split(',') : value
    setSelectedVehicleIds(ids)
    responseCacheRef.current.clear()
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

  const ZoomAndMoveTracker = () => {
    useMapEvents({
      moveend: (event) => {
        const center = event.target.getCenter()
        const z = event.target.getZoom()
        const nextTile = {
          z,
          x: lngToTileX(center.lng, z),
          y: latToTileY(center.lat, z),
        }

        setZoomLevel(z)
        setTileState((prev) => {
          if (prev.z === nextTile.z && prev.x === nextTile.x && prev.y === nextTile.y) return prev
          return nextTile
        })

        if (!selectedVehicleIds.length) return
        if (mapMoveTimer.current) window.clearTimeout(mapMoveTimer.current)
        mapMoveTimer.current = window.setTimeout(() => {
          loadVectorHistory()
        }, 650)
      },
    })
    return null
  }

  const downloadCsv = () => {
    if (!points.length) return

    const header = 'vehicleId,time,latitude,longitude,speed,angle,direction\n'
    const rows = points
      .map((point) => `${point.vehicleId},${new Date(point.time).toISOString()},${point.latitude},${point.longitude},${point.speed},${point.angle},${point.direction}`)
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vector-location-history-z${zoomLevel}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const mapElement = (
    <Box sx={{ height: 540, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }} />}
      <MapContainer center={mapCenter} zoom={zoomLevel} preferCanvas style={{ height: '100%', width: '100%' }}>
        <ZoomAndMoveTracker />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

        {points.map((point, idx) => {
          const color = vehicleColorMap.get(point.vehicleId) || '#FFDE42'
          return (
            <CircleMarker
              key={`${point._id}-${idx}`}
              center={[point.latitude, point.longitude]}
              radius={2}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
            >
              <Popup>
                <Stack spacing={0.5}>
                  <Typography variant='body2'><strong>Vehicle:</strong> {point.vehicleId}</Typography>
                  <Typography variant='body2'><strong>Time:</strong> {new Date(point.time).toLocaleString()}</Typography>
                  <Typography variant='body2'><strong>Speed:</strong> {point.speed} km/h</Typography>
                  <Typography variant='body2'><strong>Direction:</strong> {point.direction} ({Math.round(point.angle || 0)}°)</Typography>
                </Stack>
              </Popup>
            </CircleMarker>
          )
        })}

        {directionVectors.map((vector) => (
          <Polyline
            key={`vector-${vector._id}`}
            positions={[vector.from, vector.to]}
            pathOptions={{ color: vehicleColorMap.get(vector.vehicleId) || '#FFDE42', weight: 1.5, opacity: 0.65 }}
          >
            <Popup>
              <Typography variant='body2'>Direction {vector.direction} ({Math.round(vector.angle)}°)</Typography>
            </Popup>
          </Polyline>
        ))}

        {overspeedEvents.map((event, index) => (
          <CircleMarker
            key={`overspeed-${event._id}-${index}`}
            center={[event.latitude, event.longitude]}
            radius={5}
            pathOptions={{ color: '#ff1744', fillColor: '#ff1744', fillOpacity: 0.95 }}
          >
            <Popup>
              <Typography variant='body2'><strong>Overspeed:</strong> {event.speed} km/h<br />{new Date(event.time).toLocaleString()}</Typography>
            </Popup>
          </CircleMarker>
        ))}

        {harshBrakingEvents.map((event, index) => (
          <CircleMarker
            key={`harsh-${event._id}-${index}`}
            center={[event.latitude, event.longitude]}
            radius={5}
            pathOptions={{ color: '#ff9100', fillColor: '#ff9100', fillOpacity: 0.95 }}
          >
            <Popup>
              <Typography variant='body2'><strong>Harsh Braking:</strong> {event.speed} km/h<br />{new Date(event.time).toLocaleString()}</Typography>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  )

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Optimized Vector Tile Mode)</Typography>
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
              <TextField fullWidth type='datetime-local' label='From' value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth type='datetime-local' label='To' value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction='row' spacing={1} justifyContent='flex-end'>
                <Button variant='contained' onClick={loadVectorHistory} disabled={loading}>Load History</Button>
                <Button variant='outlined' onClick={downloadCsv} disabled={!points.length} startIcon={<DownloadIcon />}>CSV</Button>
                <IconButton color='primary' onClick={() => setFullscreenOpen(true)}><FullscreenIcon /></IconButton>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction='row' spacing={1} mt={2} flexWrap='wrap'>
            <Chip label={`Zoom: ${zoomLevel}`} color='primary' />
            <Chip label={`Tile: ${tileState.z}/${tileState.x}/${tileState.y}`} />
            <Chip label={`Raw points: ${rawPointCount}`} />
            <Chip label={`Rendered points: ${sampledPointCount}`} color='success' />
            <Chip label={`Direction vectors: ${directionVectors.length}`} />
            <Chip label={`Overspeed points: ${overspeedEvents.length}`} color='error' />
            <Chip label={`Harsh braking points: ${harshBrakingEvents.length}`} sx={{ bgcolor: '#ff9100', color: '#fff' }} />
          </Stack>
        </CardContent>
      </Card>

      {mapElement}

      <Dialog fullScreen open={fullscreenOpen} onClose={() => setFullscreenOpen(false)}>
        <DialogContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setFullscreenOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {mapElement}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default LocationHistory
