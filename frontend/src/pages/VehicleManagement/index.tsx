import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const VEHICLE_TYPES = ['TRUCK', 'CAR', 'BUS', 'VAN', 'BIKE']
const VEHICLE_SUB_TYPES = ['HEAVY', 'MEDIUM', 'LIGHT']

const VehicleManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')

  const [form, setForm] = useState({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', manufacturerName: 'Tata', manufacturerModel: 'Signa', manufacturerVariant: 'LPT', baseId: '', driverId: '', deviceId: '' })
  const [editForm, setEditForm] = useState({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', manufacturerName: '', manufacturerModel: '', manufacturerVariant: '', baseId: '', driverId: '', deviceId: '' })

  const load = async () => {
    try {
      const [vehicles, baseData, userData, deviceData] = await Promise.all([vehicleMonitorService.getVehicles(), vehicleMonitorService.getBases(), vehicleMonitorService.getUsers(), vehicleMonitorService.getDevices()])
      setRows((vehicles.items || []).map((x: any) => ({ id: x._id, ...x })))
      setBases(baseData.items || [])
      setDrivers((userData.items || []).filter((x: any) => x.role === 'DRIVER'))
      setDevices(deviceData.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load vehicles')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const vehicle = await vehicleMonitorService.createVehicle({
      vehicleNumber: form.vehicleNumber,
      licensePlate: form.licensePlate,
      type: form.type,
      subType: form.subType,
      baseId: form.baseId,
      driverId: form.driverId,
      deviceId: form.deviceId,
      manufacturer: { name: form.manufacturerName, model: form.manufacturerModel, variant: form.manufacturerVariant },
      manufacturing: { year: 2022, fuelType: 'Diesel', engineNumber: `${form.vehicleNumber}-E`, chassisNumber: `${form.vehicleNumber}-C` },
      physical: { color: 'White', category: 'Commercial', dimensions: { length: 10, width: 3, height: 4, unit: 'm' }, loadCapacity: 1000, axles: 2 },
      performance: { transmissionType: 'Manual', fuelTankCapacity: 200, maxSpeed: 120, minSpeed: 0 },
      status: { isActive: true }
    })

    if (form.deviceId) {
      const selectedDevice = devices.find((d: any) => d.imei === form.deviceId || d._id === form.deviceId)
      if (selectedDevice?._id) await vehicleMonitorService.linkDevice(selectedDevice._id, vehicle._id)
    }

    setForm({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', manufacturerName: 'Tata', manufacturerModel: 'Signa', manufacturerVariant: 'LPT', baseId: '', driverId: '', deviceId: '' })
    setSnack('Vehicle created successfully')
    load()
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
    setEditForm({
      vehicleNumber: row.vehicleNumber || '',
      licensePlate: row.licensePlate || '',
      type: row.type || 'TRUCK',
      subType: row.subType || 'HEAVY',
      manufacturerName: row.manufacturer?.name || '',
      manufacturerModel: row.manufacturer?.model || '',
      manufacturerVariant: row.manufacturer?.variant || '',
      baseId: row.baseId?._id || row.baseId || '',
      driverId: row.driverId?._id || row.driverId || '',
      deviceId: row.deviceId || ''
    })
    setEditOpen(true)
  }

  const update = async () => {
    await vehicleMonitorService.updateVehicle(editId, {
      vehicleNumber: editForm.vehicleNumber,
      licensePlate: editForm.licensePlate,
      type: editForm.type,
      subType: editForm.subType,
      baseId: editForm.baseId,
      driverId: editForm.driverId,
      deviceId: editForm.deviceId,
      manufacturer: { name: editForm.manufacturerName, model: editForm.manufacturerModel, variant: editForm.manufacturerVariant }
    })
    setEditOpen(false)
    setSnack('Vehicle updated successfully')
    load()
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this vehicle?')) return
    await vehicleMonitorService.deleteVehicle(id)
    setSnack('Vehicle deleted successfully')
    load()
  }

  const cols: GridColDef[] = [
    { field: 'vehicleId', headerName: 'Vehicle ID', flex: 1 },
    { field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1 },
    { field: 'licensePlate', headerName: 'License Plate', flex: 1 },
    { field: 'type', headerName: 'Vehicle Type', flex: 1 },
    { field: 'subType', headerName: 'Vehicle Sub Type', flex: 1 },
    { field: 'manufacturer', headerName: 'Manufacturer', flex: 1, valueGetter: (_, row) => row.manufacturer?.name || '-' },
    { field: 'actions', headerName: 'Actions', flex: 1, sortable: false, renderCell: ({ row }) => <Stack direction='row' spacing={1}><Button size='small' onClick={() => openEdit(row)}>Edit</Button><Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button></Stack> }
  ]

  return <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}><Typography variant='h5' mb={2}>Vehicle Management</Typography>{error && <Alert severity='error'>{error}</Alert>}<Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={2}><TextField fullWidth label='Vehicle Number' value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='License Plate' value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Vehicle Type' value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Vehicle Sub Type' value={form.subType} onChange={e => setForm({ ...form, subType: e.target.value })}>{VEHICLE_SUB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Manufacturer' value={form.manufacturerName} onChange={e => setForm({ ...form, manufacturerName: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Model' value={form.manufacturerModel} onChange={e => setForm({ ...form, manufacturerModel: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Variant' value={form.manufacturerVariant} onChange={e => setForm({ ...form, manufacturerVariant: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Base' value={form.baseId} onChange={e => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Driver' value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>{drivers.map((d: any) => <MenuItem key={d._id} value={d._id}>{d.username}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Onboard Device' value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>{devices.map((d: any) => <MenuItem key={d._id} value={d.imei}>{d.name} ({d.imei})</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Vehicle</Button></Grid></Grid></CardContent></Card><Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>

  <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md'>
    <DialogTitle>Edit Vehicle</DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}><TextField fullWidth label='Vehicle Number' value={editForm.vehicleNumber} onChange={e => setEditForm({ ...editForm, vehicleNumber: e.target.value })} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label='License Plate' value={editForm.licensePlate} onChange={e => setEditForm({ ...editForm, licensePlate: e.target.value })} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth select label='Vehicle Type' value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>{VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth select label='Vehicle Sub Type' value={editForm.subType} onChange={e => setEditForm({ ...editForm, subType: e.target.value })}>{VEHICLE_SUB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth select label='Base' value={editForm.baseId} onChange={e => setEditForm({ ...editForm, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label='Manufacturer' value={editForm.manufacturerName} onChange={e => setEditForm({ ...editForm, manufacturerName: e.target.value })} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label='Model' value={editForm.manufacturerModel} onChange={e => setEditForm({ ...editForm, manufacturerModel: e.target.value })} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label='Variant' value={editForm.manufacturerVariant} onChange={e => setEditForm({ ...editForm, manufacturerVariant: e.target.value })} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth select label='Driver' value={editForm.driverId} onChange={e => setEditForm({ ...editForm, driverId: e.target.value })}>{drivers.map((d: any) => <MenuItem key={d._id} value={d._id}>{d.username}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label='Device ID' value={editForm.deviceId} onChange={e => setEditForm({ ...editForm, deviceId: e.target.value })} /></Grid>
      </Grid>
    </DialogContent>
    <DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button variant='contained' onClick={update}>Update</Button></DialogActions>
  </Dialog>

  <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}><MuiAlert severity='success' variant='filled' onClose={() => setSnack('')}>{snack}</MuiAlert></Snackbar>
  </Box>
}

export default VehicleManagement
