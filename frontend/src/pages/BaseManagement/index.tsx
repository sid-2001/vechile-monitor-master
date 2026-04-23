import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

type GeofenceOption = { _id: string; name: string; radius?: number }
type LocationOption = { _id: string; name: string; country: string; state: string; city: string }

const initialForm = {
  name: '',
  locationId: '',
  latitude: '',
  longitude: '',
  pincode: '',
  geofenceId: '',
  baseunitid: '',
  baseunitcode: '',
  baseunitname: '',
  baseunitnumber: '',
  countrycode: 'IN',
  statecode: '',
  active: '1',
}

const BaseManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [geofences, setGeofences] = useState<GeofenceOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  const load = async () => {
    try {
      const [baseData, geofenceData, locationData] = await Promise.all([
        vehicleMonitorService.getBases(),
        vehicleMonitorService.getGeofences(),
        vehicleMonitorService.getLocations(),
      ])
      setRows((baseData.items || []).map((x: any) => ({ id: x._id, ...x })))
      setGeofences(geofenceData.items || [])
      setLocations(locationData.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load base data')
    }
  }

  useEffect(() => { load() }, [])

  const selectedLocation = locations.find((loc) => loc._id === form.locationId)

  const create = async () => {
    if (!selectedLocation) return
    await vehicleMonitorService.createBase({
      name: form.name,
      locationId: form.locationId,
      location: { latitude: Number(form.latitude), longitude: Number(form.longitude) },
      address: { city: selectedLocation.city, state: selectedLocation.state, pincode: form.pincode, country: selectedLocation.country },
      geofenceId: form.geofenceId || undefined,
      baseunitid: form.baseunitid,
      baseunitcode: form.baseunitcode,
      baseunitname: form.baseunitname,
      baseunitnumber: form.baseunitnumber,
      countrycode: form.countrycode,
      statecode: form.statecode,
      active: form.active,
    })

    setForm(initialForm)
    load()
  }

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'locationName', headerName: 'Location', flex: 1, valueGetter: (_, row) => row.locationId?.name || '-' },
    { field: 'city', headerName: 'City', flex: 1, valueGetter: (_, row) => row.address?.city },
    { field: 'state', headerName: 'State', flex: 1, valueGetter: (_, row) => row.address?.state },
    { field: 'pincode', headerName: 'Pincode', flex: 1, valueGetter: (_, row) => row.address?.pincode },
    { field: 'geofence', headerName: 'Geofence', flex: 1.2, valueGetter: (_, row) => row.geofenceId?.name || 'Not linked' }
  ]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Base Management</Typography>
      {error && <Alert severity='error'>{String(error)}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label='Location' value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })}>
                {locations.map((loc) => <MenuItem key={loc._id} value={loc._id}>{loc.name} ({loc.city}, {loc.state})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Latitude' value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Longitude' value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Pincode' value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Base Unit ID' value={form.baseunitid} onChange={e => setForm({ ...form, baseunitid: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Base Unit Code' value={form.baseunitcode} onChange={e => setForm({ ...form, baseunitcode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Base Unit Name' value={form.baseunitname} onChange={e => setForm({ ...form, baseunitname: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Base Unit Number' value={form.baseunitnumber} onChange={e => setForm({ ...form, baseunitnumber: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Country Code' value={form.countrycode} onChange={e => setForm({ ...form, countrycode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='State Code' value={form.statecode} onChange={e => setForm({ ...form, statecode: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label='Active (1/0)' value={form.active} onChange={e => setForm({ ...form, active: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Geofence' value={form.geofenceId} onChange={e => setForm({ ...form, geofenceId: e.target.value })}>
                <MenuItem value=''>None</MenuItem>
                {geofences.map((fence) => <MenuItem key={fence._id} value={fence._id}>{fence.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}><Button variant='contained' fullWidth sx={{ height: '56px' }} onClick={create}>Add Base</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>
    </Box>
  )
}

export default BaseManagement
