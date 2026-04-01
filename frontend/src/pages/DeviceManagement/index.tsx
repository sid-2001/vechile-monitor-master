import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const DeviceManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', imei: '', simNumber: '' })

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
    await vehicleMonitorService.createDevice(form)
    setForm({ name: '', imei: '', simNumber: '' })
    load()
  }

  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'imei', headerName: 'IMEI', flex: 1 },
    { field: 'simNumber', headerName: 'SIM', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'linkedVehicle', headerName: 'Linked Vehicle', flex: 1, valueGetter: (_, row) => row.linkedVehicleId?.vehicleNumber || '-' }
  ]

  return (
    <Box>
      <Typography variant='h5' mb={2}>Onboard Devices</Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label='Device Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label='IMEI' value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label='SIM Number' value={form.simNumber} onChange={e => setForm({ ...form, simNumber: e.target.value })} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Onboard Device</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>
    </Box>
  )
}

export default DeviceManagement
