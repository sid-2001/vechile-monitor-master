import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { socket } from '../../services/socket'
import 'leaflet/dist/leaflet.css'

type VehicleOption = { _id: string; vehicleNumber: string }
type LocationPoint = {
  _id: string
  latitude: number
  longitude: number
  speed: number
  time: string
}

type QueryPayload = { vehicleId: string; from: string; to: string }

const LocationHistory = () => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [points, setPoints] = useState<LocationPoint[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [loadedRecords, setLoadedRecords] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const activeQueryRef = useRef<QueryPayload | null>(null)

  const loadVehicles = async () => {
    try {
      const data = await vehicleMonitorService.getVehicles()
      setVehicles(data.items || [])
    } catch (e: any) {
      setError(e?.error_message || 'Unable to load vehicles')
    }
  }

  useEffect(() => {
    loadVehicles()

    const onReset = () => {
      setPoints([])
      setLoadedRecords(0)
      setMapReady(false)
    }

    const onStart = (payload: { total?: number }) => {
      setTotalRecords(payload?.total || 0)
      setLoadedRecords(0)
      setLoading(true)
      setMapReady(false)
    }

    const onBatch = (records: LocationPoint[]) => {
      if (!Array.isArray(records) || records.length === 0) return
      setPoints((prev) => [...prev, ...records])
      setLoadedRecords((prev) => prev + records.length)
    }

    const onDone = () => {
      setLoading(false)
      setMapReady(true)
    }

    const onError = (payload: { message?: string }) => {
      setLoading(false)
      setMapReady(false)
      setError(payload?.message || 'Failed to stream location history')
    }

    const onReconnect = () => {
      if (activeQueryRef.current) {
        socket.emit('locationHistory:subscribe', activeQueryRef.current)
      }
    }

    socket.on('locationHistory:reset', onReset)
    socket.on('locationHistory:start', onStart)
    socket.on('locationHistory:batch', onBatch)
    socket.on('locationHistory:done', onDone)
    socket.on('locationHistory:error', onError)
    socket.on('reconnect', onReconnect)

    return () => {
      socket.emit('locationHistory:unsubscribe')
      socket.off('locationHistory:reset', onReset)
      socket.off('locationHistory:start', onStart)
      socket.off('locationHistory:batch', onBatch)
      socket.off('locationHistory:done', onDone)
      socket.off('locationHistory:error', onError)
      socket.off('reconnect', onReconnect)
    }
  }, [])

  const fetchHistory = () => {
    if (!selectedVehicle || !fromDate || !toDate) {
      setError('Please select vehicle and both date-time filters')
      return
    }

    const payload = {
      vehicleId: selectedVehicle,
      from: new Date(fromDate).toISOString(),
      to: new Date(toDate).toISOString()
    }

    setError('')
    setLoading(true)
    setPoints([])
    setMapReady(false)
    setLoadedRecords(0)
    setTotalRecords(0)

    activeQueryRef.current = payload
    socket.emit('locationHistory:unsubscribe')
    socket.emit('locationHistory:subscribe', payload)
  }

  const mapCenter = useMemo<[number, number]>(() => {
    if (points.length > 0) return [points[0].latitude, points[0].longitude]
    return [22.9734, 78.6569]
  }, [points])

  const progressValue = totalRecords > 0 ? Math.min((loadedRecords / totalRecords) * 100, 100) : 0

  const downloadCsv = () => {
    if (points.length === 0) return
    const csvHeader = 'time,latitude,longitude,speed\n'
    const csvRows = points.map((point) => `${new Date(point.time).toISOString()},${point.latitude},${point.longitude},${point.speed}`).join('\n')
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `location-history-${selectedVehicle}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const MapView = (
    <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer center={mapCenter} zoom={8} preferCanvas style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        {points.map((point, idx) => (
          <CircleMarker
            key={point._id || `${point.time}-${idx}`}
            center={[point.latitude, point.longitude]}
            radius={3}
            pathOptions={{ color: '#FFDE42', fillOpacity: 0.8 }}
          >
            <Popup>
              <Stack spacing={0.5}>
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

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Socket Stream)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{String(error)}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Vehicle' value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                {vehicles.map((vehicle) => <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth type='datetime-local' label='From' value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth type='datetime-local' label='To' value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant='contained' onClick={fetchHistory} disabled={loading} sx={{ height: '56px' }}>{loading ? 'Streaming...' : 'Stream History'}</Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ mb: 0.5 }}>Loaded {loadedRecords} / {totalRecords || '?'} records</Typography>
            <LinearProgress variant={totalRecords > 0 ? 'determinate' : 'indeterminate'} value={progressValue} />
          </Box>
        </CardContent>
      </Card>

      {mapReady && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack direction='row' justifyContent='flex-end' spacing={1} sx={{ mb: 1 }}>
                  <Button size='small' startIcon={<DownloadIcon />} variant='outlined' onClick={downloadCsv}>Download CSV</Button>
                  <IconButton size='small' onClick={() => setFullscreenOpen(true)}><FullscreenIcon /></IconButton>
                </Stack>
                {MapView}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={1}>History Points ({points.length})</Typography>
                <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
                  {points.slice(-5000).map((point, idx) => (
                    <Box key={`${point._id || idx}`} sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant='body2'>{new Date(point.time).toLocaleString()}</Typography>
                      <Typography variant='caption' color='text.secondary'>Speed: {point.speed} km/h</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog fullScreen open={fullscreenOpen} onClose={() => setFullscreenOpen(false)}>
        <DialogContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='h6'>Location History Map</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {MapView}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default LocationHistory
