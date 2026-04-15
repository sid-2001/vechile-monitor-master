import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Circle, MapContainer, Polygon, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { geofenceStorage, type GeofenceArea } from '../../helpers/geofence-storage'
import 'leaflet/dist/leaflet.css'

type DrawMode = 'polygon' | 'circle'

const dottedStyle = {
  color: '#FFDE42',
  weight: 3,
  dashArray: '8 8',
  fillColor: '#FFDE42',
  fillOpacity: 0.08
}

const MapClickHandler: React.FC<{
  mode: DrawMode
  setPolygonPoints: React.Dispatch<React.SetStateAction<[number, number][]>>
  circleCenter: [number, number] | null
  setCircleCenter: React.Dispatch<React.SetStateAction<[number, number] | null>>
  setCircleRadius: React.Dispatch<React.SetStateAction<number>>
}> = ({
  mode,
  setPolygonPoints,
  circleCenter,
  setCircleCenter,
  setCircleRadius
}) => {
  useMapEvents({
    click: (event) => {
      const point: [number, number] = [event.latlng.lat, event.latlng.lng]
      if (mode === 'polygon') {
        setPolygonPoints(prev => [...prev, point])
      } else {
        if (!circleCenter) {
          setCircleCenter(point)
        } else {
          const from = L.latLng(circleCenter[0], circleCenter[1])
          const to = L.latLng(point[0], point[1])
          setCircleRadius(Math.round(from.distanceTo(to)))
        }
      }
    }
  })

  return null
}

const GeofenceManagement = () => {
  const [mode, setMode] = useState<DrawMode>('polygon')
  const [name, setName] = useState('')
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null)
  const [circleRadius, setCircleRadius] = useState(500)
  const [error, setError] = useState('')
  const [savedFences, setSavedFences] = useState<GeofenceArea[]>(() => geofenceStorage.getAll())

  const resetDrawState = () => {
    setPolygonPoints([])
    setCircleCenter(null)
    setCircleRadius(500)
  }

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Geofence name is required.'
    if (mode === 'polygon' && polygonPoints.length < 3) return 'Add at least 3 points to create a polygon.'
    if (mode === 'circle' && !circleCenter) return 'Click map to set circle center.'
    if (mode === 'circle' && circleRadius <= 0) return 'Circle radius should be greater than 0.'
    return ''
  }, [circleRadius, circleCenter, mode, name, polygonPoints.length])

  const handleSave = () => {
    if (validationError) {
      setError(validationError)
      return
    }

    const geofence: GeofenceArea = {
      id: `${Date.now()}`,
      name: name.trim(),
      shape: mode,
      points: mode === 'polygon' ? polygonPoints : undefined,
      center: mode === 'circle' ? circleCenter || undefined : undefined,
      radius: mode === 'circle' ? circleRadius : undefined,
      createdAt: new Date().toISOString()
    }

    geofenceStorage.add(geofence)
    setSavedFences(geofenceStorage.getAll())
    setName('')
    setError('')
    resetDrawState()
  }

  const handleDelete = (id: string) => {
    geofenceStorage.remove(id)
    setSavedFences(geofenceStorage.getAll())
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Geofence Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select an area on the map to create a geofence. Fences are shown as dotted boundaries.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Geofence Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button
                variant={mode === 'polygon' ? 'contained' : 'outlined'}
                onClick={() => {
                  setMode('polygon')
                  resetDrawState()
                }}
              >
                Polygon
              </Button>
              <Button
                variant={mode === 'circle' ? 'contained' : 'outlined'}
                onClick={() => {
                  setMode('circle')
                  resetDrawState()
                }}
              >
                Circle
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box sx={{ height: { xs: 380, md: 520 }, borderRadius: 2, overflow: 'hidden' }}>
              <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                  mode={mode}
                  setPolygonPoints={setPolygonPoints}
                  circleCenter={circleCenter}
                  setCircleCenter={setCircleCenter}
                  setCircleRadius={setCircleRadius}
                />

                {polygonPoints.length > 0 && mode === 'polygon' && <Polygon positions={polygonPoints} pathOptions={dottedStyle} />}
                {circleCenter && mode === 'circle' && (
                  <Circle center={circleCenter} radius={circleRadius} pathOptions={dottedStyle} />
                )}

                {savedFences.map((fence) =>
                  fence.shape === 'polygon' && fence.points ? (
                    <Polygon key={fence.id} positions={fence.points} pathOptions={dottedStyle} />
                  ) : fence.shape === 'circle' && fence.center && fence.radius ? (
                    <Circle key={fence.id} center={fence.center} radius={fence.radius} pathOptions={dottedStyle} />
                  ) : null
                )}
              </MapContainer>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSave}>
                Save Geofence
              </Button>
              <Button variant="outlined" onClick={resetDrawState}>
                Clear Drawing
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Saved Geofences
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense sx={{ maxHeight: 520, overflowY: 'auto' }}>
                {savedFences.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No geofence added yet.
                  </Typography>
                )}
                {savedFences.map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      <Button color="error" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.shape.toUpperCase()} • ${new Date(item.createdAt).toLocaleString()}`}
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
