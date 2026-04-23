import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Autocomplete } from '@mui/material'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const DeviceSimMapping = () => {


  const [devices, setDevices] = useState<any[]>([])
  const [sims, setSims] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [rows,setRows] = useState<any[]>([])
const [mappings, setMappings] = useState<any[]>([]);

  

  const [form, setForm] = useState({
  deviceid: '',
  simid: '',

  countrycode: '',
  statecode: '',
  locationid: '',
  baseunitid: '',

  active: '1',
  createdby: ''
})

  //Load all data
  // const load = async () => {
  //   try {
  //     const [mapRes, deviceRes, simRes] = await Promise.all([
  //       vehicleMonitorService.getDeviceSimMappings?.() || [],
  //       vehicleMonitorService.getDevices(),
  //       vehicleMonitorService.getSims()
  //     ])

  //     // mapping table
  //     setRows((mapRes || []).map((x: any) => ({
  //       id: x._id,
  //       device: x.deviceid?.name,
  //       imei: x.deviceid?.imei,
        
  // simid: x.simid?._id,
  // deviceid: x.deviceid?._id,
  //       sim: x.simid?.simnumber,
  //       location: x.locationid,
  //       base: x.baseunitid,
  //       active: x.active
  //     })))

      
  //     setDevices(deviceRes.items || [])
  //     setSims(simRes || [])
  //     console.log("deviceRes:", deviceRes)

  //   } catch (e: any) {
  //     setError('Failed to load mapping data')
  //   }
  // }

  const load = async () => {
  try {
    const [mapRes, deviceRes, simRes] = await Promise.all([
      vehicleMonitorService.getDeviceSimMappings(),
      vehicleMonitorService.getDevices(),
      vehicleMonitorService.getSims()
    ])

    // 🔥 ADD THIS LINE (IMPORTANT)
    setMappings(mapRes || []);

    // existing code (UNCHANGED)
    setRows((mapRes || []).map((x: any) => ({
  id: x._id,
  device: x.deviceid?.name,
  imei: x.deviceid?.imei,
  sim: x.simid?.simnumber,

  countrycode: x.countrycode,
  statecode: x.statecode,
  location: x.locationid,
  base: x.baseunitid,

  active: x.active,
  createdby: x.createdby,

  simid: x.simid?._id,
  deviceid: x.deviceid?._id
})))

    setDevices(deviceRes.items || [])
    setSims(simRes || [])
    console.log("deviceRes:", deviceRes)

  } catch (e: any) {
  console.log("LOAD ERROR:", e)

  setError(
    e?.error_message ||
    e?.message ||
    "Failed to load mapping data"
  )
}
}

  useEffect(() => {
    load()
  }, [])

  // 🔹 CREATE mapping
  const create = async () => {
    try {
     if (!form.deviceid && !form.simid) {
  setError("Please select both device and SIM")
  return
}

if (!form.deviceid) {
  setError("Please select device")
  return
}

if (!form.simid) {
  setError("Please select SIM")
  return
}
     await vehicleMonitorService.createDeviceSimMapping({
  deviceid: form.deviceid,
  simid: form.simid,

  countrycode: form.countrycode,
  statecode: form.statecode,
  locationid: form.locationid,
  baseunitid: form.baseunitid,

  active: form.active,
  createdby: form.createdby
})

      setSnack('Mapping created successfully')
      setForm({ deviceid: '', simid: '' })
      load()

    }catch (e: any) {
  console.log("FULL ERROR:", e)

  const msg =
    e?.error_message ||   // ✅ MAIN FIX
    e?.message ||
    "Mapping failed";

  setError(msg);
}
  }

  // 🔹 DELETE mapping
  const onDelete = async (id: string) => {
    if (!window.confirm('Delete mapping?')) return

    await vehicleMonitorService.deleteDeviceSimMapping(id)
    setSnack('Deleted successfully')
    load()
  }

  // 🔹 Disable already mapped SIM
  const mappedSimIds = rows.map(r => r.simid)
  const mappedDeviceIds = (rows || []).map((r: any) => r.deviceid)

 const columns: GridColDef[] = [
  { field: 'device', headerName: 'Device', flex: 1 },
  { field: 'imei', headerName: 'IMEI', flex: 1 },
  { field: 'sim', headerName: 'SIM Number', flex: 1 },

  { field: 'countrycode', headerName: 'Country', flex: 1 },
  { field: 'statecode', headerName: 'State', flex: 1 },
  { field: 'location', headerName: 'Location', flex: 1 },
  { field: 'base', headerName: 'Base', flex: 1 },

  {
    field: 'active',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => (params.value ? 'ACTIVE' : 'INACTIVE')
  },

  { field: 'createdby', headerName: 'Created By', flex: 1 },

  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1,
    renderCell: ({ row }) => (
      <Button size="small" color="error" onClick={() => onDelete(row.id)}>
        Delete
      </Button>
    )
  }
]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto' }}>

      <Typography variant='h5' mb={2}>
        Device SIM Mapping
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}

      {/* FORM */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>

            {/* DEVICE DROPDOWN */}
            <Grid item xs={12} md={4}>
              <Autocomplete
               options={devices || []}
  value={devices.find(d => d._id === form.deviceid) || null}
 getOptionLabel={(o) => {
  if (!o) return "";

  const mapping = mappings.find(
    (m: any) => m.deviceid?._id === o._id && m.active
  );

  return `${o.name} (${o.imei})${
    mapping ? ` 🔒 ${mapping.simid?.simnumber}` : ""
  }`;
}}
  isOptionEqualToValue={(option, value) => option._id === value._id}

  // 🔥 MAIN LOGIC
  getOptionDisabled={(option) => mappedDeviceIds.includes(option._id)}

  onChange={(_, v) => setForm({ ...form, deviceid: v?._id || '' })}
  renderOption={(props, option) => {
  const mapping = mappings.find(
    (m: any) => m.deviceid?._id === option._id && m.active
  );

  return (
    <li {...props} style={{ opacity: mapping ? 0.5 : 1 }}>
      {option.name} ({option.imei})
      {mapping && ` Linked with 🔒 ${mapping.simid?.simnumber}`}
    </li>
  );
}}
  renderInput={(params) => (
    <TextField {...params} label="Select Device" />
  )}
              />
            </Grid>

            {/* SIM DROPDOWN */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={sims || []}
  value={sims.find(s => s._id === form.simid) || null}
  getOptionLabel={(o) => o?.simnumber || ''}
  isOptionEqualToValue={(option, value) => option._id === value._id}

  // 🔥 MAIN DISABLE LOGIC
  getOptionDisabled={(option) => mappedSimIds.includes(option._id)}

  renderOption={(props, option) => (
    <li {...props} key={option._id}>
      {option.simnumber} ({option.operator})
      {mappedSimIds.includes(option._id) && " 🔒 Already mapped"}
    </li>
  )}

  onChange={(_, v) => setForm({ ...form, simid: v?._id || '' })}
  renderInput={(params) => (
    <TextField {...params} label="Select SIM" />
  )}
              />
            </Grid>

            {/* EXTRA FIELDS */}

<Grid item xs={12} md={2}>
  <TextField fullWidth label="Country Code"
    onChange={(e) => setForm({ ...form, countrycode: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label="State Code"
    onChange={(e) => setForm({ ...form, statecode: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label="Location ID"
    onChange={(e) => setForm({ ...form, locationid: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label="Base Unit ID"
    onChange={(e) => setForm({ ...form, baseunitid: e.target.value })}/>
</Grid>

<Grid item xs={12} md={2}>
  <TextField fullWidth label="Created By"
    onChange={(e) => setForm({ ...form, createdby: e.target.value })}/>
</Grid>

            {/* BUTTON */}
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                sx={{ height: '56px' }}
                onClick={create}
              >
                Map Device & SIM
              </Button>
            </Grid>

          </Grid>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent>
          <div style={{ height: 420 }}>
            <DataGrid rows={rows} columns={columns} />
          </div>
        </CardContent>
      </Card>

      {/* SNACKBAR */}
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}>
        <MuiAlert severity='success' variant='filled'>
          {snack}
        </MuiAlert>
      </Snackbar>

    </Box>
  )
}

export default DeviceSimMapping