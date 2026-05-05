import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const VEHICLE_TYPES = ['TRUCK', 'CAR', 'BUS', 'VAN', 'BIKE']
const VEHICLE_SUB_TYPES = ['HEAVY', 'MEDIUM', 'LIGHT']
const SAMPLE_LOCATION_HISTORY = [
  { latitude: 28.6139, longitude: 77.2090, speed: 32 },
  { latitude: 28.6228, longitude: 77.2197, speed: 40 },
  { latitude: 28.6311, longitude: 77.2311, speed: 36 }
]

const VehicleManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')



const [form, setForm] = useState({
  vehicleNumber: '',
  licensePlate: '',
  type: 'TRUCK',
  subType: 'HEAVY',

  manufacturerName: 'Tata',
  manufacturerModel: 'Signa',
  manufacturerVariant: 'LPT',

  baseId: '',
  driverId: '',
  deviceId: '',
  maxSpeed: '120',

  make: '',
  model: '',
  fueltype: '',
  enginenumber: '',
  chassisnumber: '',
  color: '',
  loadcapacity: '',
  noofaxles: '',
  transmissiontype: '',
  fueltankcapacity: '',
  harshBraking: '',
   highPitch: '',
  highRoll: ''
})
  const [editForm, setEditForm] = useState({ vehicleNumber: '', licensePlate: '', type: 'TRUCK', subType: 'HEAVY', manufacturerName: '', manufacturerModel: '', manufacturerVariant: '', baseId: '', driverId: '', deviceId: '', maxSpeed: '120', harshBraking: '',highPitch: '',
  highRoll: '' })

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
    const selectedDevice = devices.find((d: any) => d.imei === form.deviceId || d._id === form.deviceId)
   const vehicle = await vehicleMonitorService.createVehicle({
  vehicleNumber: form.vehicleNumber,
  licensePlate: form.licensePlate,
  type: form.type,
  subType: form.subType,
  baseId: form.baseId,
  driverId: form.driverId,
  deviceId: form.deviceId,

  manufacturer: {
    name: form.manufacturerName,
    model: form.manufacturerModel,
    variant: form.manufacturerVariant
  },

  manufacturing: {
    year: 2022,
    fuelType: form.fueltype,
    engineNumber: form.enginenumber,
    chassisNumber: form.chassisnumber
  },

  physical: {
    color: form.color,
    category: 'Commercial',
    dimensions: {
      length: 10,
      width: 3,
      height: 4,
      unit: 'm'
    },
    loadCapacity: Number(form.loadcapacity || 0),
    axles: Number(form.noofaxles || 0)
  },

  performance: {
    transmissionType: form.transmissiontype,
    fuelTankCapacity: Number(form.fueltankcapacity || 0),
    maxSpeed: Number(form.maxSpeed || 120),
     highPitch: Number(form.highPitch || 45),
  highRoll: Number(form.highRoll || 45),
    harshBraking: Number(form.harshBraking || 0),
    minSpeed: 0
  },

  status: { isActive: true }
})

    if (form.deviceId) {
      if (selectedDevice?._id) await vehicleMonitorService.linkDevice(selectedDevice._id, vehicle._id)
    }
    const locationDeviceId = selectedDevice?._id || form.deviceId
    if (vehicle?._id && locationDeviceId) {
      const now = Date.now()
      await Promise.all(
        SAMPLE_LOCATION_HISTORY.map((point, index) =>
          vehicleMonitorService.createVehicleLocation({
            vehicleId: vehicle._id,
            deviceId: locationDeviceId,
            time: new Date(now - (SAMPLE_LOCATION_HISTORY.length - index) * 60000).toISOString(),
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed,
            ignition: true
          })
        )
      )
    }

setForm({
  vehicleNumber: '',
  licensePlate: '',
  type: 'TRUCK',
  subType: 'HEAVY',
  manufacturerName: 'Tata',
  manufacturerModel: 'Signa',
  manufacturerVariant: 'LPT',
  baseId: '',
  driverId: '',
  deviceId: '',
  maxSpeed: '120',

  make: '',
  model: '',
  fueltype: '',
  enginenumber: '',
  chassisnumber: '',
  color: '',
  loadcapacity: '',
  noofaxles: '',
  transmissiontype: '',
  fueltankcapacity: '',
  harshBraking: '',
  highPitch:'',
  highRoll:''
  
})  
  setSnack('Vehicle created successfully with sample location history')
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
      deviceId: row.deviceId || '',
      maxSpeed: String(row.performance?.maxSpeed || 120),
      highPitch: String(row.performance?.highPitch || 45),
highRoll: String(row.performance?.highRoll || 45),
      harshBraking: String(row.performance?.harshBraking || 0)
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
      manufacturer: { name: editForm.manufacturerName, model: editForm.manufacturerModel, variant: editForm.manufacturerVariant },
      performance: { transmissionType: 'Manual', fuelTankCapacity: 200, maxSpeed: Number(editForm.maxSpeed || 120), minSpeed: 0, harshBraking: Number(editForm.harshBraking || 0),highPitch: Number(editForm.highPitch || 45),
      highRoll: Number(editForm.highRoll || 45) }
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

//  const cols: GridColDef[] = [
//   { field: 'vehicleId', headerName: 'Vehicle ID', flex: 1 },
//   { field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1 },
//   { field: 'licensePlate', headerName: 'License Plate', flex: 1 },
 


//   // 🔥 ENGINE / FUEL
//   // { field: 'fueltype', headerName: 'Fuel', flex: 1, valueGetter: (_, row) => row.manufacturing?.fuelType || '-' },
//   { field: 'enginenumber', headerName: 'Engine No', flex: 1, valueGetter: (_, row) => row.manufacturing?.engineNumber || '-' },
//   { field: 'chassisnumber', headerName: 'Chassis No', flex: 1, valueGetter: (_, row) => row.manufacturing?.chassisNumber || '-' },

//   // 🔥 PHYSICAL
//   // { field: 'color', headerName: 'Color', flex: 1, valueGetter: (_, row) => row.physical?.color || '-' },
//   // { field: 'loadcapacity', headerName: 'Load', flex: 1, valueGetter: (_, row) => row.physical?.loadCapacity || '-' },

//   // 🔥 PERFORMANCE
//   { field: 'transmission', headerName: 'Transmission', flex: 1, valueGetter: (_, row) => row.performance?.transmissionType || '-' },
//   { field: 'fuelTank', headerName: 'Tank', flex: 1, valueGetter: (_, row) => row.performance?.fuelTankCapacity || '-' },
//   { field: 'maxSpeed', headerName: 'Max Speed', flex: 1, valueGetter: (_, row) => row.performance?.maxSpeed || '-' },
//   {
//   field: 'harshBraking',
//   headerName: 'Harsh Braking',
//   flex: 1,
//   valueGetter: (_, row) => row.performance?.harshBraking || 0
// },
// {
//   field: 'highPitch',
//   headerName: 'Pitch',
//   flex: 1,
//   width: 30,
//   valueGetter: (_, row) => row.performance?.highPitch || 0
// },
// {
//   field: 'highRoll',
//   headerName: 'Roll',
//   flex: 1,
//   valueGetter: (_, row) => row.performance?.highRoll || 0
// },

//   // 🔥 ACTIONS
//   {
//     field: 'actions',
//     headerName: 'Actions',
//     flex: 1,
//     sortable: false,
//     renderCell: ({ row }) => (
//       <Stack direction='row' spacing={1}>
//         <Button size='small' onClick={() => openEdit(row)}>Edit</Button>
//         <Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button>
//       </Stack>
//     )
//   }
// ]

const cols: GridColDef[] = [
  { field: 'vehicleId', headerName: 'Vehicle ID', width: 160 },
  { field: 'vehicleNumber', headerName: 'Vehicle Number', width: 180 },
  { field: 'licensePlate', headerName: 'License Plate', width: 180 },

  { field: 'enginenumber', headerName: 'Engine No', width: 160, valueGetter: (_, row) => row.manufacturing?.engineNumber || '-' },
  { field: 'chassisnumber', headerName: 'Chassis No', width: 160, valueGetter: (_, row) => row.manufacturing?.chassisNumber || '-' },

  { field: 'transmission', headerName: 'Transmission', width: 150, valueGetter: (_, row) => row.performance?.transmissionType || '-' },
  { field: 'fuelTank', headerName: 'Tank', width: 120, valueGetter: (_, row) => row.performance?.fuelTankCapacity || '-' },
  { field: 'maxSpeed', headerName: 'Max Speed', width: 130, valueGetter: (_, row) => row.performance?.maxSpeed || '-' },

  { field: 'harshBraking', headerName: 'Harsh Braking', width: 140, valueGetter: (_, row) => row.performance?.harshBraking || 0 },
  { field: 'highPitch', headerName: 'Pitch', width: 100, valueGetter: (_, row) => row.performance?.highPitch || 0 },
  { field: 'highRoll', headerName: 'Roll', width: 100, valueGetter: (_, row) => row.performance?.highRoll || 0 },

  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: ({ row }) => (
      <Stack direction='row' spacing={1}>
        <Button size='small' onClick={() => openEdit(row)}>Edit</Button>
        <Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button>
      </Stack>
    )
  }
]

  return(
   <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%'}}><Typography variant='h5' mb={2}>Vehicle Management</Typography>{error && <Alert severity='error'>{error}</Alert>}
   
   <Card sx={{ mb: 2 }}>
    <CardContent>
    <Grid container spacing={2}><Grid item xs={12} md={2}>
      <TextField fullWidth label='Vehicle Number' value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></Grid>
      <Grid item xs={12} md={2}><TextField fullWidth label='License Plate' value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} /></Grid>
      {/* 🔥 NEW FIELDS START */}

{/* <Grid item xs={12} md={2}>
  <TextField fullWidth label='Make' onChange={e => setForm({ ...form, make: e.target.value })}/>
</Grid> */}

{/* <Grid item xs={12} md={2}>
  <TextField fullWidth label='Model' onChange={e => setForm({ ...form, model: e.target.value })}/>
</Grid> */}

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Fuel Type' onChange={e => setForm({ ...form, fueltype: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Engine Number' onChange={e => setForm({ ...form, enginenumber: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Chassis Number' onChange={e => setForm({ ...form, chassisnumber: e.target.value })}/>
</Grid>
{/* 
<Grid item xs={12} md={2}>
  <TextField fullWidth label='Color' onChange={e => setForm({ ...form, color: e.target.value })}/>
</Grid> */}

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Load Capacity' onChange={e => setForm({ ...form, loadcapacity: e.target.value })}/>
</Grid>

{/* <Grid item xs={12} md={2}>
  <TextField fullWidth label='No. of Axles' onChange={e => setForm({ ...form, noofaxles: e.target.value })}/>
</Grid> */}

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Transmission' onChange={e => setForm({ ...form, transmissiontype: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label='Fuel Tank Capacity' onChange={e => setForm({ ...form, fueltankcapacity: e.target.value })}/>
</Grid>

{/* 🔥 NEW FIELDS END */}
      <Grid item xs={12} md={2}><TextField fullWidth select label='Vehicle Type' value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Vehicle Sub Type' value={form.subType} onChange={e => setForm({ ...form, subType: e.target.value })}>{VEHICLE_SUB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Manufacturer' value={form.manufacturerName} onChange={e => setForm({ ...form, manufacturerName: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Model' value={form.manufacturerModel} onChange={e => setForm({ ...form, manufacturerModel: e.target.value })} /></Grid>
      <Grid item xs={12} md={2}><TextField fullWidth label='Variant' value={form.manufacturerVariant} onChange={e => setForm({ ...form, manufacturerVariant: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Base' value={form.baseId} onChange={e => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Operator' value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>{drivers.map((d: any) => <MenuItem key={d._id} value={d._id}>{d.username}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={2}><TextField fullWidth select label='Onboard Device' value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>{devices.map((d: any) => <MenuItem key={d._id} value={d.imei}>{d.name} ({d.imei})</MenuItem>)}</TextField></Grid>
  <Grid item xs={12} md={2}>
    
    <TextField fullWidth type='number' label='Max Speed (km/h)' value={form.maxSpeed} onChange={e => setForm({ ...form, maxSpeed: e.target.value })} /></Grid>
    <Grid item xs={12} md={2}>
  <TextField
    fullWidth
    type="number"
    label="Harsh Braking"
    value={form.harshBraking}
    onChange={e => setForm({ ...form, harshBraking: e.target.value })}
  />
</Grid>
<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    type="number"
    label="High Pitch"
    value={form.highPitch}
    onChange={e => setForm({ ...form, highPitch: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    type="number"
    label="High Roll"
    value={form.highRoll}
    onChange={e => setForm({ ...form, highRoll: e.target.value })}
  />
</Grid>
    <Grid item xs={12} md={2}>
      <Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add Vehicle</Button></Grid>
      
      </Grid></CardContent></Card><Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={cols} /></div></CardContent></Card>

  <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md' PaperProps={{ sx: { bgcolor: 'primary.main', color: 'text.primary', border: '1px solid', borderColor: 'primary.main' } }}>
    <DialogTitle sx={{  color: 'common.white' }}>Edit Vehicle</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
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
        <Grid item xs={12} md={6}><TextField fullWidth label='Device ID' value={editForm.deviceId} onChange={e => setEditForm({ ...editForm, deviceId: e.target.value })} /></Grid><Grid item xs={12} md={6}><TextField fullWidth type='number' label='Max Speed (km/h)' value={editForm.maxSpeed} onChange={e => setEditForm({ ...editForm, maxSpeed: e.target.value })} /></Grid>
        <Grid item xs={12} md={6}>
  <TextField
    fullWidth
    type="number"
    label="High Pitch"
    value={editForm.highPitch}
    onChange={e => setEditForm({ ...editForm, highPitch: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    type="number"
    label="High Roll"
    value={editForm.highRoll}
    onChange={e => setEditForm({ ...editForm, highRoll: e.target.value })}
  />
</Grid>
        <Grid item xs={12} md={6}>
  <TextField
    fullWidth
    type="number"
    label="Harsh Braking"
    value={editForm.harshBraking}
    onChange={e => setEditForm({ ...editForm, harshBraking: e.target.value })}
  />
</Grid>
      </Grid>
    </DialogContent>
    <DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button variant='contained' onClick={update}>Update</Button></DialogActions>
  </Dialog>

  <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}><MuiAlert severity='success' variant='filled' onClose={() => setSnack('')} sx={{ bgcolor: 'primary.main', color: 'common.white' }}>{snack}</MuiAlert></Snackbar>
  </Box>)
}


export default VehicleManagement
