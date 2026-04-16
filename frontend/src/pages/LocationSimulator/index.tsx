import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import 'leaflet/dist/leaflet.css'

type VehicleItem = { _id: string; vehicleNumber: string; deviceId?: string }

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

const LocationSimulator = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [position, setPosition] = useState<[number, number]>([22.9734, 78.6569])
  const [recording, setRecording] = useState(false)
  const [pointsCreated, setPointsCreated] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await vehicleMonitorService.getVehicles()
      setVehicles(data.items || [])
    }
    load()
  }, [])

  const selectedVehicle = useMemo(() => vehicles.find((v) => v._id === vehicleId), [vehicles, vehicleId])

  useEffect(() => {
    if (!recording || !selectedVehicle?.deviceId || !vehicleId) return

    timerRef.current = window.setInterval(async () => {
      try {
        await vehicleMonitorService.createVehicleLocation({
          vehicleId,
          deviceId: selectedVehicle.deviceId,
          time: new Date().toISOString(),
          latitude: position[0],
          longitude: position[1],
          speed: Math.floor(Math.random() * 60),
          ignition: true,
          angle: Math.floor(Math.random() * 360)
        })
        setPointsCreated((prev) => prev + 1)
      } catch (error) {
        console.error('Simulator failed to create point', error)
      }
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [recording, selectedVehicle?.deviceId, vehicleId, position])

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location Simulator (Testing)</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Vehicle' value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='body2'>Current: {position[0].toFixed(6)}, {position[1].toFixed(6)}</Typography>
              <Typography variant='body2'>Points created: {pointsCreated}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction='row' spacing={1}>
                <Button variant='contained' disabled={!vehicleId || recording} onClick={() => setRecording(true)}>Start Recording</Button>
                <Button variant='outlined' color='error' disabled={!recording} onClick={() => setRecording(false)}>Stop</Button>
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
