import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND

const TrackingScreen = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState('')

  const loadVehicles = async () => {
    try {
      const [vehicleRes, locationRes] = await Promise.all([
        vehicleMonitorService.getVehicles(),
        vehicleMonitorService.getVehicleLocations({ limit: 1000, sortBy: 'time', sortOrder: 'desc' })
      ])

      const latestByVehicle = new Map<string, any>()
      ;(locationRes.items || []).forEach((loc: any) => {
        if (!latestByVehicle.has(String(loc.vehicleId))) latestByVehicle.set(String(loc.vehicleId), loc)
      })

      setVehicles((vehicleRes.items || []).map((v: any) => {
        const loc = latestByVehicle.get(v._id)
        return {
          id: v._id,
          vehicleNumber: v.vehicleNumber,
          deviceId: v.deviceId,
          status: loc?.ignition ? 'moving' : 'stopped',
          speed: loc?.speed || 0,
          lat: loc?.latitude,
          lng: loc?.longitude,
          lastUpdated: loc?.time
        }
      }))
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load tracking data')
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (!BACKEND_URL) return
    const wsUrl = `${BACKEND_URL}`.replace(/^http/i, 'ws') + '/ws'
    const socket = new WebSocket(wsUrl)
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data || '{}')
      if (message?.event !== 'vehicleLocationUpdate') return
      const payload = message.payload
      setVehicles((prev) => prev.map((v) => String(v.id) === String(payload.vehicleId) ? {
        ...v,
        lat: payload.latitude,
        lng: payload.longitude,
        speed: payload.speed,
        status: payload.ignition ? 'moving' : 'stopped',
        lastUpdated: payload.time
      } : v))
    }

    return () => { socket.close() }
  }, [])

  const markers = useMemo(() => vehicles.filter((v) => v.lat && v.lng), [vehicles])

  const searchHistory = async () => {
    if (!selectedVehicle || !fromDate || !toDate) return
    const res = await vehicleMonitorService.getVehicleLocations({ vehicleId: selectedVehicle, from: new Date(fromDate).toISOString(), to: new Date(toDate).toISOString(), limit: 500, sortBy: 'time', sortOrder: 'asc' })
    setHistory(res.items || [])
  }

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Live Tracking</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Select fullWidth value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} displayEmpty><MenuItem value=''>Select Vehicle</MenuItem>{vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.vehicleNumber}</MenuItem>)}</Select></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type='datetime-local' value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth type='datetime-local' value={toDate} onChange={(e) => setToDate(e.target.value)} /></Grid>
            <Grid item xs={12} md={2}><Chip label='Load History' color='primary' onClick={searchHistory} clickable /></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card><CardContent><div style={{ height: 500 }}><MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />{markers.map(v => <Marker key={v.id} position={[v.lat, v.lng]}><Popup><Stack><Typography variant='subtitle2'>{v.vehicleNumber}</Typography><Typography variant='caption'>Speed: {v.speed} km/h</Typography><Typography variant='caption'>Status: {v.status}</Typography></Stack></Popup></Marker>)}</MapContainer></div></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant='h6' mb={1}>Live Vehicles</Typography><Stack spacing={1}>{vehicles.map(v => <Box key={v.id} sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}><Typography variant='body2'>{v.vehicleNumber}</Typography><Typography variant='caption'>Status: {v.status} | Speed: {v.speed}</Typography></Box>)}</Stack></CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent><Typography variant='h6' mb={1}>History Points</Typography><Typography variant='body2'>{history.length} points from API</Typography></CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TrackingScreen
