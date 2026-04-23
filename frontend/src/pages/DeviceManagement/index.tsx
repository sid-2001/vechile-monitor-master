import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { Country, State } from 'country-state-city'

const DeviceManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const countries = useMemo(() => Country.getAllCountries(), [])
  const states = useMemo(() => (form.countrycode ? State.getStatesOfCountry(form.countrycode) : []), [form.countrycode])
const [form, setForm] = useState({
  name: '',
  imei: '',
  simNumber: '',

  devicemodel: '',
  devicemodelnumber: '',
  manufacturer: '',
  firmwareversion: '',
  serialnumber: '',

  countrycode: 'IN',
  statecode: '',
  locationid: '',
  baseunitid: '',

  active: '1',
  createdby: ''
}) 
const [editForm, setEditForm] = useState({
  name: '',
  imei: '',
  simNumber: '',

  devicemodel: '',
  devicemodelnumber: '',
  manufacturer: '',
  firmwareversion: '',
  serialnumber: '',

  countrycode: '',
  statecode: '',
  locationid: '',
  baseunitid: '',

  active: '1',
  createdby: '',

  status: 'ONBOARDED'
})
  const load = async () => {
    try {
      const data = await vehicleMonitorService.getDevices()
      setRows((data.items || []).map((x: any) => ({ id: x._id, ...x })))
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load devices')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
   await vehicleMonitorService.createDevice({
  name: form.name,
  imei: form.imei,
  simNumber: form.simNumber,

  devicemodel: form.devicemodel,
  devicemodelnumber: form.devicemodelnumber,
  manufacturer: form.manufacturer,
  firmwareversion: form.firmwareversion,
  serialnumber: form.serialnumber,

  countrycode: form.countrycode,
  statecode: form.statecode,
  locationid: form.locationid,
  baseunitid: form.baseunitid,

  active: form.active,
  createdby: form.createdby
})
   setForm({
  name: '',
  imei: '',
  simNumber: '',

  devicemodel: '',
  devicemodelnumber: '',
  manufacturer: '',
  firmwareversion: '',
  serialnumber: '',

  countrycode: 'IN',
  statecode: '',
  locationid: '',
  baseunitid: '',

  active: '1',
  createdby: ''
})
    setSnack('Device onboarded successfully')
    load()
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
setEditForm({
  name: row.name || '',
  imei: row.imei || '',
  simNumber: row.simNumber || '',

  devicemodel: row.devicemodel || '',
  devicemodelnumber: row.devicemodelnumber || '',
  manufacturer: row.manufacturer || '',
  firmwareversion: row.firmwareversion || '',
  serialnumber: row.serialnumber || '',

  countrycode: row.countrycode || 'IN',
  statecode: row.statecode || '',
  locationid: row.locationid || '',
  baseunitid: row.baseunitid || '',

  active: row.active || '1',
  createdby: row.createdby || '',

  status: row.status || 'ONBOARDED'
})  
  setEditOpen(true)
  }

  const update = async () => {
    await vehicleMonitorService.updateDevice(editId, editForm)
    setEditOpen(false)
    setSnack('Device updated successfully')
    load()
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this device?')) return
    await vehicleMonitorService.deleteDevice(id)
    setSnack('Device deleted successfully')
    load()
  }

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'imei', headerName: 'IMEI', flex: 1 },
    { field: 'simNumber', headerName: 'SIM', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'linkedVehicle', headerName: 'Linked Vehicle', flex: 1, valueGetter: (_, row) => row.linkedVehicleId?.vehicleNumber || '-' },
    { field: 'actions', headerName: 'Actions', flex: 1, sortable: false, renderCell: ({ row }) => <Stack direction='row' spacing={1}><Button size='small' onClick={() => openEdit(row)}>Edit</Button><Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button></Stack> }
  ]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Onboard Devices</Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth label='Device Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid><Grid item xs={12} md={3}><TextField fullWidth label='IMEI' value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} /></Grid><Grid item xs={12} md={3}><TextField fullWidth label='SIM Number' value={form.simNumber} onChange={e => setForm({ ...form, simNumber: e.target.value })} /></Grid>
      {/* 🔥 NEW DEVICE FIELDS */}

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Device Model' onChange={e => setForm({ ...form, devicemodel: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Model Number' onChange={e => setForm({ ...form, devicemodelnumber: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Manufacturer' onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Firmware Version' onChange={e => setForm({ ...form, firmwareversion: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Serial Number' onChange={e => setForm({ ...form, serialnumber: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth select label='Country' value={form.countrycode} onChange={e => setForm({ ...form, countrycode: e.target.value, statecode: '' })}>
    {countries.map((country) => <MenuItem key={country.isoCode} value={country.isoCode}>{country.name}</MenuItem>)}
  </TextField>
</Grid>

{form.countrycode && <Grid item xs={12} md={3}>
  <TextField fullWidth select label='State' value={form.statecode} onChange={e => setForm({ ...form, statecode: e.target.value })}>
    {states.map((state) => <MenuItem key={state.isoCode} value={state.isoCode}>{state.name}</MenuItem>)}
  </TextField>
</Grid>}

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Location ID' onChange={e => setForm({ ...form, locationid: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Base Unit ID' onChange={e => setForm({ ...form, baseunitid: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Created By' onChange={e => setForm({ ...form, createdby: e.target.value })} />
</Grid>

<Grid item xs={12} md={3}>
  <TextField fullWidth label='Active (1/0)' onChange={e => setForm({ ...form, active: e.target.value })} />
</Grid><Grid item xs={12} md={3}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Onboard Device</Button></Grid></Grid></CardContent></Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>

      <Dialog sx={{
bgcolor:'primary.main'

      }}  open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label='Device Name' value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label='IMEI' value={editForm.imei} onChange={(e) => setEditForm({ ...editForm, imei: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label='SIM Number' value={editForm.simNumber} onChange={(e) => setEditForm({ ...editForm, simNumber: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth select label='Status' value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><MenuItem value='ONBOARDED'>ONBOARDED</MenuItem><MenuItem value='LINKED'>LINKED</MenuItem></TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button variant='contained' onClick={update}>Update</Button></DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}>
        <MuiAlert severity='success' variant='filled' onClose={() => setSnack('')}>{snack}</MuiAlert>
      </Snackbar>
    </Box>
  )
}

export default DeviceManagement
