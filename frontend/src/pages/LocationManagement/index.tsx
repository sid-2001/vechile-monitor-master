import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Country, State, City } from 'country-state-city'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const LocationManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', countryCode: '', stateCode: '', city: '' })

  const countries = useMemo(() => Country.getAllCountries(), [])
  const states = useMemo(() => (form.countryCode ? State.getStatesOfCountry(form.countryCode) : []), [form.countryCode])
  const cities = useMemo(() => (
    form.countryCode && form.stateCode
      ? City.getCitiesOfState(form.countryCode, form.stateCode)
      : []
  ), [form.countryCode, form.stateCode])

  const load = async () => {
    try {
      const data = await vehicleMonitorService.getLocations()
      setRows((data.items || []).map((x: any) => ({ id: x._id, ...x })))
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load locations')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const selectedCountry = countries.find((country) => country.isoCode === form.countryCode)
    const selectedState = states.find((state) => state.isoCode === form.stateCode)

    if (!selectedCountry || !selectedState || !form.city) {
      setError('Please select country, state and city')
      return
    }

    await vehicleMonitorService.createLocation({
      name: form.name,
      country: selectedCountry.name,
      state: selectedState.name,
      city: form.city,
    })

    setForm({ name: '', countryCode: '', stateCode: '', city: '' })
    setError('')
    load()
  }

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'country', headerName: 'Country', flex: 1 },
    { field: 'state', headerName: 'State', flex: 1 },
    { field: 'city', headerName: 'City', flex: 1 },
  ]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Location Management</Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label='Country'
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value, stateCode: '', city: '' })}
              >
                {countries.map((country) => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>{country.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {form.countryCode && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label='State'
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value, city: '' })}
                >
                  {states.map((state) => (
                    <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {form.countryCode && form.stateCode && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label='City'
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  {cities.map((city) => (
                    <MenuItem key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>{city.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Location</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>
    </Box>
  )
}

export default LocationManagement
