import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import 'leaflet/dist/leaflet.css'

type VehicleItem = { _id: string; vehicleNumber: string; deviceId?: string }
type GeofenceItem = { _id: string; name: string; center: { latitude: number; longitude: number }; radius: number }

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

const LocationSimulator = () => {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [geofences, setGeofences] = useState<GeofenceItem[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [position, setPosition] = useState<[number, number]>([22.9734, 78.6569])
  const [recording, setRecording] = useState(false)
  const [pointsCreated, setPointsCreated] = useState(0)
  const [speed, setSpeed] = useState(40)
  const [ignition, setIgnition] = useState(true)
  const [error, setError] = useState('')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [vehicleData, geofenceData] = await Promise.all([
          vehicleMonitorService.getVehicles(),
          vehicleMonitorService.getGeofences()
        ])
        setVehicles(vehicleData.items || [])
        setGeofences(geofenceData.items || [])
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load simulator data')
      }
    }
    load()
  }, [])

  const selectedVehicle = useMemo(() => vehicles.find((v) => v._id === vehicleId), [vehicles, vehicleId])

  const pushLocation = async (override?: Partial<{ speed: number; latitude: number; longitude: number; ignition: boolean }>) => {
    if (!selectedVehicle?.deviceId || !vehicleId) return

    await vehicleMonitorService.createVehicleLocation({
      vehicleId,
      deviceId: selectedVehicle.deviceId,
      time: new Date().toISOString(),
      latitude: override?.latitude ?? position[0],
      longitude: override?.longitude ?? position[1],
      speed: override?.speed ?? speed,
      ignition: override?.ignition ?? ignition,
      angle: Math.floor(Math.random() * 360)
    })
    setPointsCreated((prev) => prev + 1)
  }

  useEffect(() => {
    if (!recording || !selectedVehicle?.deviceId || !vehicleId) return

    timerRef.current = window.setInterval(async () => {
      try {
        await pushLocation()
      } catch (err) {
        console.error('Simulator failed to create point', err)
      }
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [recording, selectedVehicle?.deviceId, vehicleId, speed, ignition, position])

  const testOverspeed = async () => {
    try {
      await pushLocation({ speed: Math.max(speed, 140) })
    } catch (e: any) {
      setError(e?.error_message || 'Failed to test overspeed')
    }
  }

  const testHarshBraking = async () => {
    try {
      await pushLocation({ speed: Math.max(speed, 70) })
      setTimeout(() => {
        pushLocation({ speed: 0 }).catch(console.error)
      }, 500)
    } catch (e: any) {
      setError(e?.error_message || 'Failed to test harsh braking')
    }
  }

  const endSimulation = () => {
    setRecording(false)
    setSpeed(40)
    setIgnition(true)
    navigate('/tracking')
  }

  const testOutOfFence = async () => {
    if (!geofences.length) return
    const fence = geofences[0]
    try {
      await pushLocation({ latitude: fence.center.latitude, longitude: fence.center.longitude, speed: 20 })
      await pushLocation({ latitude: fence.center.latitude + 0.3, longitude: fence.center.longitude + 0.3, speed: 25 })
    } catch (e: any) {
      setError(e?.error_message || 'Failed to test geofence entry/exit')
    }
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location Simulator (Testing)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label='Vehicle' value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth type='number' label='Speed (km/h)' value={speed} onChange={(e) => setSpeed(Number(e.target.value || 0))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth select label='Ignition' value={ignition ? 'on' : 'off'} onChange={(e) => setIgnition(e.target.value === 'on')}>
                <MenuItem value='on'>ON</MenuItem>
                <MenuItem value='off'>OFF</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant='body2'>Current: {position[0].toFixed(6)}, {position[1].toFixed(6)}</Typography>
              <Typography variant='body2'>Points created: {pointsCreated}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                <Button variant='contained' disabled={!vehicleId || recording} onClick={() => setRecording(true)}>Start Recording</Button>
                <Button variant='outlined' color='error' disabled={!recording} onClick={() => setRecording(false)}>Stop</Button>
                <Button variant='outlined' color='success' disabled={!vehicleId} onClick={endSimulation}>End Simulation (Back to Live)</Button>
                <Button variant='contained' color='warning' disabled={!vehicleId} onClick={testOverspeed}>Test Overspeed</Button>
                <Button variant='contained' color='error' disabled={!vehicleId} onClick={testHarshBraking}>Test Harsh Braking</Button>
                <Button variant='contained' color='secondary' disabled={!vehicleId || !geofences.length} onClick={testOutOfFence}>Test Geofence In/Out</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer center={position} zoom={6} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
              {geofences.map((fence) => (
                <Circle key={fence._id} center={[fence.center.latitude, fence.center.longitude]} radius={fence.radius} pathOptions={{ color: '#FFDE42' }} />
              ))}
              <Marker
                position={position}
                draggable
                icon={markerIcon}
                eventHandlers={{
                  dragend: (event) => {
                    const p = event.target.getLatLng()
                    setPosition([p.lat, p.lng])
                  }
                }}
              />
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LocationSimulator
