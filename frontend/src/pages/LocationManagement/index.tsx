import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Country, State, City } from 'country-state-city'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material'
import MuiAlert from '@mui/material/Alert'

const LocationManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', countryCode: '', stateCode: '', city: '' })

  const [editOpen, setEditOpen] = useState(false)
const [editId, setEditId] = useState('')
const [editForm, setEditForm] = useState({ name: '', countryCode: '', stateCode: '', city: '' })
const [snack, setSnack] = useState('')

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


const handleEdit = (row: any) => {
  const country = countries.find(c => c.name === row.country)
  const stateList = country ? State.getStatesOfCountry(country.isoCode) : []
  const state = stateList.find(s => s.name === row.state)

  setEditId(row.id)

  setEditForm({
    name: row.name,
    countryCode: country?.isoCode || '',
    stateCode: state?.isoCode || '',
    city: row.city
  })

  setEditOpen(true)
}

const update = async () => {
  const selectedCountry = countries.find(c => c.isoCode === editForm.countryCode)
  const selectedState = State.getStatesOfCountry(editForm.countryCode)
    .find(s => s.isoCode === editForm.stateCode)

  await vehicleMonitorService.updateLocation(editId, {
    name: editForm.name,
    country: selectedCountry?.name,
    state: selectedState?.name,
    city: editForm.city
  })

  setEditOpen(false)
  setSnack('Location updated successfully')
  load()
}

const handleDelete = async (id: string) => {
  if (!window.confirm('Delete this location?')) return

  await vehicleMonitorService.deleteLocation(id)
  setSnack('Location deleted successfully')
  load()
}

const cols: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'country', headerName: 'Country', flex: 1 },
  { field: 'state', headerName: 'State', flex: 1 },
  { field: 'city', headerName: 'City', flex: 1 },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1,
    sortable: false,
    renderCell: (params) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    gap={2}
    width="100%"
  >
    <Box
      onClick={() => handleEdit(params.row)}
      sx={{
        color: '#8BC34A',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        '&:hover': { textDecoration: 'underline' }
      }}
    >
      EDIT
    </Box>

    <Box
      onClick={() => handleDelete(params.row.id)}
      sx={{
        color: '#FF3D00',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        '&:hover': { textDecoration: 'underline' }
      }}
    >
      DELETE
    </Box>
  </Box>
)
  }
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
            <Grid item xs={12} md={3 } display="flex" alignItems="center"><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Location</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols}  sx={{
    '& .MuiDataGrid-cell': {
      display: 'flex',
      alignItems: 'center',   // 👈 ye main fix hai
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // optional (center header text)
    }
  }} /></div></CardContent></Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>Edit Location</DialogTitle>

  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Name"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Country"
          value={editForm.countryCode}
          onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value, stateCode: '', city: '' })}
        >
          {countries.map(c => (
            <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {editForm.countryCode && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="State"
            value={editForm.stateCode}
            onChange={(e) => setEditForm({ ...editForm, stateCode: e.target.value, city: '' })}
          >
            {State.getStatesOfCountry(editForm.countryCode).map(s => (
              <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      )}

      {editForm.countryCode && editForm.stateCode && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="City"
            value={editForm.city}
            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
          >
            {City.getCitiesOfState(editForm.countryCode, editForm.stateCode).map(city => (
              <MenuItem key={city.name} value={city.name}>{city.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      )}

    </Grid>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={update}>Update</Button>
  </DialogActions>
</Dialog>

<Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}>
  <MuiAlert severity="success" variant="filled" onClose={() => setSnack('')}>
    {snack}
  </MuiAlert>
</Snackbar>
    </Box>
  )
}

export default LocationManagement
