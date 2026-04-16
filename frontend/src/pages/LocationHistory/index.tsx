import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
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

const LocationHistory = () => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [points, setPoints] = useState<LocationPoint[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    const onReset = () => setPoints([])
    const onRecord = (record: LocationPoint) => {
      setPoints((prev) => [...prev, record])
    }
    const onDone = () => setLoading(false)
    const onError = (payload: { message?: string }) => {
      setLoading(false)
      setError(payload?.message || 'Failed to stream location history')
    }

    socket.on('locationHistory:reset', onReset)
    socket.on('locationHistory:record', onRecord)
    socket.on('locationHistory:done', onDone)
    socket.on('locationHistory:error', onError)

    return () => {
      socket.emit('locationHistory:unsubscribe')
      socket.off('locationHistory:reset', onReset)
      socket.off('locationHistory:record', onRecord)
      socket.off('locationHistory:done', onDone)
      socket.off('locationHistory:error', onError)
    }
  }, [])

  const fetchHistory = () => {
    if (!selectedVehicle || !fromDate || !toDate) {
      setError('Please select vehicle and both date-time filters')
      return
    }

    setError('')
    setLoading(true)
    setPoints([])

    socket.emit('locationHistory:unsubscribe')
    socket.emit('locationHistory:subscribe', {
      vehicleId: selectedVehicle,
      from: new Date(fromDate).toISOString(),
      to: new Date(toDate).toISOString()
    })
  }

  const mapCenter = useMemo<[number, number]>(() => {
    if (points.length > 0) return [points[0].latitude, points[0].longitude]
    return [22.9734, 78.6569]
  }, [points])

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Socket Stream)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{String(error)}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label='Vehicle'
                value={selectedVehicle}
                onChange={e => setSelectedVehicle(e.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type='datetime-local'
                label='From'
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type='datetime-local'
                label='To'
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant='contained' onClick={fetchHistory} disabled={loading} sx={{ height: '56px' }}>
                {loading ? 'Streaming...' : 'Stream History'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                  {points.map((point, idx) => (
                    <CircleMarker
                      key={point._id || `${point.time}-${idx}`}
                      center={[point.latitude, point.longitude]}
                      radius={5}
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' mb={1}>History Points ({points.length})</Typography>
              <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
                {points.map((point, idx) => (
                  <Box key={`${point._id || idx}`} sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant='body2'>#{idx + 1} • {new Date(point.time).toLocaleString()}</Typography>
                    <Typography variant='caption' color='text.secondary'>Speed: {point.speed} km/h</Typography>
                  </Box>
                ))}
                {points.length === 0 && <Typography variant='body2' color='text.secondary'>No points yet. Apply filter.</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LocationHistory
