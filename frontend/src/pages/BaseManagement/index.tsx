import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { State, City } from 'country-state-city'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const COUNTRY_CODE = 'IN'

type GeofenceOption = { _id: string; name: string; radius?: number }

const BaseManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [geofences, setGeofences] = useState<GeofenceOption[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
  baseunitid: '',
  baseunitcode: '',
  baseunitname: '',
  baseunitnumber: '',

  countrycode: 'IN',
  statecode: '',
  locationid: '',

  latitude: '',
  longitude: '',

  active: '1',
  createdby: '',
})

  const states = useMemo(() => State.getStatesOfCountry(COUNTRY_CODE), [])
  const cities = useMemo(() => City.getCitiesOfState(COUNTRY_CODE, form.state), [form.state])

  const load = async () => {
    try {
      const [baseData, geofenceData] = await Promise.all([
        vehicleMonitorService.getBases(),
        vehicleMonitorService.getGeofences()
      ])
      setRows((baseData.items || []).map((x: any) => ({ id: x._id, ...x })))
      setGeofences(geofenceData.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load base data')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    await vehicleMonitorService.createBase({
      name: form.name,
      location: { latitude: Number(form.latitude), longitude: Number(form.longitude) },
      address: { city: form.city, state: form.state, pincode: form.pincode, country: 'India' },
      geofenceId: form.geofenceId || undefined
    })

    setForm({ name: '', city: '', state: '', pincode: '', latitude: '', longitude: '', geofenceId: '' })
    load()
  }

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'city', headerName: 'City', flex: 1, valueGetter: (_, row) => row.address?.city },
    { field: 'state', headerName: 'State', flex: 1, valueGetter: (_, row) => row.address?.state },
    { field: 'pincode', headerName: 'Pincode', flex: 1, valueGetter: (_, row) => row.address?.pincode },
    {
      field: 'geofence',
      headerName: 'Geofence',
      flex: 1.2,
      valueGetter: (_, row) => row.geofenceId?.name || 'Not linked'
    }
  ]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Base Management</Typography>
      {error && <Alert severity='error'>{String(error)}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth select label='State' value={form.state} onChange={e => setForm({ ...form, state: e.target.value, city: '' })}>
                {states.map(s => <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth select label='City' value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                {cities.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label='Pincode' value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label='Latitude' value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label='Longitude' value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={2}>
  <TextField fullWidth label='Base Unit Code' onChange={e => setForm({ ...form, baseunitcode: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Base Unit Name' onChange={e => setForm({ ...form, baseunitname: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Base Unit Number' onChange={e => setForm({ ...form, baseunitnumber: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Country Code' value='IN' disabled />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='State Code' onChange={e => setForm({ ...form, statecode: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Location ID' onChange={e => setForm({ ...form, locationid: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Created By' onChange={e => setForm({ ...form, createdby: e.target.value })} />
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Active (1/0)' onChange={e => setForm({ ...form, active: e.target.value })} />
</Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label='Geofence'
                value={form.geofenceId}
                onChange={e => setForm({ ...form, geofenceId: e.target.value })}
                helperText='Select geofence from Geofence Setup screen'
              >
                <MenuItem value=''>None</MenuItem>
                {geofences.map((fence) => (
                  <MenuItem key={fence._id} value={fence._id}>{fence.name}{fence.radius ? ` (${fence.radius}m)` : ''}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant='contained' fullWidth sx={{ height: '56px' }} onClick={create}>Add Base</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div>
        </CardContent>
      </Card>
    </Box>
  )
}

export default BaseManagement
