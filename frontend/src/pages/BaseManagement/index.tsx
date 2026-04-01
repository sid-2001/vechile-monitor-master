import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const BaseManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', city: '', state: '', pincode: '', latitude: '', longitude: '' })
  const load = async () => { try { const data = await vehicleMonitorService.getBases(); setRows((data.items || []).map((x: any) => ({ id: x._id, ...x }))) } catch (e: any) { setError(e?.error_message || 'Failed to load bases') } }
  useEffect(() => { load() }, [])
  const create = async () => { await vehicleMonitorService.createBase({ name: form.name, location: { latitude: Number(form.latitude), longitude: Number(form.longitude) }, address: { city: form.city, state: form.state, pincode: form.pincode, country: 'India' } }); setForm({ name: '', city: '', state: '', pincode: '', latitude: '', longitude: '' }); load() }
  const cols: GridColDef[] = [{ field: 'name', headerName: 'Name', flex: 1 }, { field: 'city', headerName: 'City', flex: 1, valueGetter: (_, row) => row.address?.city }, { field: 'state', headerName: 'State', flex: 1, valueGetter: (_, row) => row.address?.state }, { field: 'pincode', headerName: 'Pincode', flex: 1, valueGetter: (_, row) => row.address?.pincode }]
  return <Box><Typography variant='h5' mb={2}>Base Management</Typography>{error && <Alert severity='error'>{error}</Alert>}<Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}>{Object.entries(form).map(([k, v]) => <Grid item xs={12} md={2} key={k}><TextField fullWidth label={k} value={v} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Grid>)}<Grid item xs={12} md={2}><Button variant='contained' fullWidth sx={{ height: '56px' }} onClick={create}>Add Base</Button></Grid></Grid></CardContent></Card><Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card></Box>
}

export default BaseManagement
