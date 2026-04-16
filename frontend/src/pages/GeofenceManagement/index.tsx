import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import 'leaflet/dist/leaflet.css'

type Fence = {
  _id: string
  name: string
  baseId: string | { _id: string; name?: string }
  center: { latitude: number; longitude: number }
  radius: number
  createdAt?: string
}

type BaseOption = { _id: string; name: string }

const dottedStyle = {
  color: '#FFDE42',
  weight: 3,
  dashArray: '8 8',
  fillColor: '#FFDE42',
  fillOpacity: 0.08
}

const radiusHandleIcon = L.divIcon({
  className: 'geofence-radius-handle',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#ffde42;border:2px solid #1B0C0C"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

const GeofenceMapEvents = ({ onPickCenter }: { onPickCenter: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (event) => onPickCenter(event.latlng.lat, event.latlng.lng)
  })
  return null
}

const getBaseIdValue = (value: string | { _id: string; name?: string }) => (typeof value === 'string' ? value : value?._id)

const GeofenceManagement = () => {
  const [name, setName] = useState('')
  const [baseId, setBaseId] = useState('')
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [radius, setRadius] = useState(500)
  const [error, setError] = useState('')
  const [savedFences, setSavedFences] = useState<Fence[]>([])
  const [bases, setBases] = useState<BaseOption[]>([])
  const [editingId, setEditingId] = useState('')

  const centerHandle = useMemo<[number, number] | null>(() => {
    if (!center) return null
    const latOffset = radius / 111320
    return [center[0] + latOffset, center[1]]
  }, [center, radius])

  const loadData = async () => {
    try {
      const [fenceRes, baseRes] = await Promise.all([vehicleMonitorService.getGeofences(), vehicleMonitorService.getBases()])
      setSavedFences(fenceRes.items || [])
      setBases(baseRes.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load geofence data')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setName('')
    setBaseId('')
    setCenter(null)
    setRadius(500)
    setEditingId('')
  }

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Geofence name is required.'
    if (!baseId) return 'Please select a base.'
    if (!center) return 'Click on map to set geofence center.'
    if (radius <= 0) return 'Radius should be greater than 0.'
    return ''
  }, [baseId, center, name, radius])

  const handleSave = async () => {
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      name: name.trim(),
      baseId,
      center: { latitude: center![0], longitude: center![1] },
      radius
    }

    try {
      if (editingId) {
        await vehicleMonitorService.updateGeofence(editingId, payload)
      } else {
        await vehicleMonitorService.createGeofence(payload)
      }
      await loadData()
      resetForm()
    } catch (e: any) {
      setError(e?.error_message || 'Unable to save geofence')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await vehicleMonitorService.deleteGeofence(id)
      await loadData()
      if (editingId === id) resetForm()
    } catch (e: any) {
      setError(e?.error_message || 'Unable to delete geofence')
    }
  }

  const handleEdit = (fence: Fence) => {
    setEditingId(fence._id)
    setName(fence.name)
    setBaseId(getBaseIdValue(fence.baseId) || '')
    setCenter([fence.center.latitude, fence.center.longitude])
    setRadius(fence.radius)
    setError('')
  }

  const activeFenceStyle = { ...dottedStyle, color: '#4caf50', fillColor: '#4caf50' }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Geofence Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a base, click map for center point, and adjust radius with slider or drag pointer.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <TextField fullWidth label="Geofence Name" value={name} onChange={(event) => setName(event.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Base</InputLabel>
                <Select value={baseId} label="Base" onChange={(event) => setBaseId(event.target.value)}>
                  {bases.map((base) => (
                    <MenuItem key={base._id} value={base._id}>{base.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Radius: {radius} meters</Typography>
                <Slider value={radius} min={50} max={5000} step={10} onChange={(_, value) => setRadius(Number(value))} />
              </Box>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {String(error)}
              </Alert>
            )}

            <Box sx={{ height: { xs: 380, md: 520 }, borderRadius: 2, overflow: 'hidden' }}>
              <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <GeofenceMapEvents onPickCenter={(lat, lng) => setCenter([lat, lng])} />

                {savedFences.map((fence) => (
                  <Circle
                    key={fence._id}
                    center={[fence.center.latitude, fence.center.longitude]}
                    radius={fence.radius}
                    pathOptions={editingId === fence._id ? activeFenceStyle : dottedStyle}
                  />
                ))}

                {center && <Circle center={center} radius={radius} pathOptions={activeFenceStyle} />}
                {center && centerHandle && (
                  <Marker
                    position={centerHandle}
                    draggable
                    icon={radiusHandleIcon}
                    eventHandlers={{
                      drag: (event) => {
                        const latlng = event.target.getLatLng()
                        const from = L.latLng(center[0], center[1])
                        const to = L.latLng(latlng.lat, latlng.lng)
                        setRadius(Math.max(50, Math.round(from.distanceTo(to))))
                      }
                    }}
                  />
                )}
              </MapContainer>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSave}>{editingId ? 'Update Geofence' : 'Save Geofence'}</Button>
              <Button variant="outlined" onClick={resetForm}>Clear</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Saved Geofences</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense sx={{ maxHeight: 520, overflowY: 'auto' }}>
                {savedFences.length === 0 && <Typography variant="body2" color="text.secondary">No geofence added yet.</Typography>}
                {savedFences.map((item) => (
                  <ListItem
                    key={item._id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(item)}>Edit</Button>
                        <Button color="error" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => handleDelete(item._id)}>Delete</Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={item.name}
                      secondary={`Base: ${typeof item.baseId === 'string' ? item.baseId : item.baseId?.name || '-'} • Radius: ${item.radius}m`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default GeofenceManagement
