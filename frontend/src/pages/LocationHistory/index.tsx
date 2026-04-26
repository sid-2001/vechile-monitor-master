import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.vectorgrid'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

type VehicleOption = { _id: string; vehicleNumber: string }

const HISTORY_WINDOW_HOURS = 24
const HISTORY_WINDOW_MS = HISTORY_WINDOW_HOURS * 60 * 60 * 1000

const toInputDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const VectorTileLayer = ({ tileUrl }: { tileUrl: string }) => {
  const map = useMap()

  useEffect(() => {
    const vectorGrid = (L as any).vectorGrid.protobuf(tileUrl, {
      rendererFactory: (L as any).canvas.tile,
      interactive: true,
      maxZoom: 20,
      vectorTileLayerStyles: {
        locations: {
          radius: 2.5,
          fillColor: '#FFDE42',
          color: '#FFDE42',
          fillOpacity: 0.85,
          opacity: 1,
          weight: 1,
        },
      },
    })

    vectorGrid.on('click', (event: any) => {
      const props = event.layer?.properties || {}
      const deviceId = props.device_id || 'N/A'
      const timestamp = props.timestamp ? new Date(props.timestamp).toLocaleString() : 'N/A'
      const speed = props.speed ?? 'N/A'

      L.popup()
        .setLatLng(event.latlng)
        .setContent(`
          <div style="min-width: 180px; color: black;">
            <div><b>Device:</b> ${deviceId}</div>
            <div><b>Timestamp:</b> ${timestamp}</div>
            <div><b>Speed:</b> ${speed}</div>
          </div>
        `)
        .openOn(map)
    })

    vectorGrid.addTo(map)
    return () => {
      map.removeLayer(vectorGrid)
    }
  }, [map, tileUrl])

  return null
}

const LocationHistory = () => {
  const now = new Date()
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [fromDate, setFromDate] = useState(toInputDate(new Date(now.getTime() - HISTORY_WINDOW_MS)))
  const [toDate, setToDate] = useState(toInputDate(now))
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

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

  const onVehicleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setSelectedVehicleIds(typeof value === 'string' ? value.split(',') : value)
  }

  const tileUrl = useMemo(() => {
    const query = new URLSearchParams()
    if (selectedVehicleIds.length) query.set('vehicleIds', selectedVehicleIds.join(','))
    if (fromDate) query.set('from', new Date(fromDate).toISOString())
    if (toDate) query.set('to', new Date(toDate).toISOString())
    query.set('source', 'live')

    return `/tiles/{z}/{x}/{y}.pbf?${query.toString()}`
  }, [fromDate, selectedVehicleIds, toDate, reloadKey])

  const validateFilters = () => {
    const from = new Date(fromDate)
    const to = new Date(toDate)

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      setError('Please select valid From/To date-time')
      return false
    }
    if (from > to) {
      setError('From date must be before To date')
      return false
    }
    if (to.getTime() - from.getTime() > HISTORY_WINDOW_MS) {
      setError(`History range cannot exceed ${HISTORY_WINDOW_HOURS} hours`)
      return false
    }
    setError('')
    return true
  }

  const onLoadHistory = () => {
    if (!validateFilters()) return
    setReloadKey((k) => k + 1)
  }

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Vector Tile PBF + Canvas)</Typography>
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
                <Button variant='contained' onClick={onLoadHistory}>Load History</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ height: 620, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={[22.9734, 78.6569]} zoom={6} preferCanvas style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          <VectorTileLayer tileUrl={tileUrl} key={tileUrl} />
        </MapContainer>
      </Box>
    </Box>
  )
}

export default LocationHistory
