import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const LocationManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', country: '', state: '', city: '' })

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
    await vehicleMonitorService.createLocation(form)
    setForm({ name: '', country: '', state: '', city: '' })
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
            <Grid item xs={12} md={3}><TextField fullWidth label='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label='Country' value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label='State' value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label='City' value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Location</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>
    </Box>
  )
}

export default LocationManagement
