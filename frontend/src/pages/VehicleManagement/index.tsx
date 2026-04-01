import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const VehicleManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', baseId: '', driverId: '', deviceId: '' })

  const load = async () => {
    try {
      const [vehicles, baseData, userData, deviceData] = await Promise.all([
        vehicleMonitorService.getVehicles(),
        vehicleMonitorService.getBases(),
        vehicleMonitorService.getUsers(),
        vehicleMonitorService.getDevices()
      ])
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
      ...form,
      manufacturer: { name: 'Tata', model: 'Signa', variant: 'LPT' },
      manufacturing: { year: 2022, fuelType: 'Diesel', engineNumber: `${form.vehicleNumber}-E`, chassisNumber: `${form.vehicleNumber}-C` },
      physical: { color: 'White', category: 'Commercial', dimensions: { length: 10, width: 3, height: 4, unit: 'm' }, loadCapacity: 1000, axles: 2 },
      performance: { transmissionType: 'Manual', fuelTankCapacity: 200, maxSpeed: 120, minSpeed: 0 },
      status: { isActive: true }
    })

    if (form.deviceId) {
      const selectedDevice = devices.find((d: any) => d.imei === form.deviceId || d._id === form.deviceId)
      if (selectedDevice?._id) {
        await vehicleMonitorService.linkDevice(selectedDevice._id, vehicle._id)
      }
    }

    setForm({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', baseId: '', driverId: '', deviceId: '' })
    load()
  }

  const cols: GridColDef[] = [
    { field: 'vehicleId', headerName: 'Vehicle ID', flex: 1 },
    { field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'deviceId', headerName: 'Device', flex: 1 }
  ]

  return <Box><Typography variant='h5' mb={2}>Vehicle Management</Typography>{error && <Alert severity='error'>{error}</Alert>}<Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={2}><TextField fullWidth label='Vehicle Number' value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='License Plate' value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Base' value={form.baseId} onChange={e => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Driver' value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>{drivers.map((d: any) => <MenuItem key={d._id} value={d._id}>{d.username}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Onboard Device' value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>{devices.map((d: any) => <MenuItem key={d._id} value={d.imei}>{d.name} ({d.imei})</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Vehicle</Button></Grid></Grid></CardContent></Card><Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card></Box>
}

export default VehicleManagement
