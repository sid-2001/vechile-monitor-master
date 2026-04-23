import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import { Country, State } from "country-state-city";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { useTheme } from '@emotion/react'
import { Autocomplete } from '@mui/material'

const SimManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const theme = useTheme()

 
  const [form, setForm] = useState({
  simnumber: '',
  phonenumber: '',
  iccidnumber: '',
  operator: '',
  expirydate: '',
  countrycode: '',
  statecode: '',
  locationid: '',
  baseunitid: '',
  active: true
})

 const [editForm, setEditForm] = useState({
  simnumber: '',
  phonenumber: '',
  iccidnumber: '',
  operator: '',
  expirydate: '',
  countrycode: '',
  statecode: '',
  locationid: '',
  baseunitid: '',
  active: true
})


  const load = async () => {
    try {
      const res = await vehicleMonitorService.getSims()
      console.log("SIM API RESPONSE:", res)

      // 🔥 LINE 39
setRows((res || []).map((x: any) => ({
  id: x._id,
  ...x
})))
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load SIMs')
    }
  }

  useEffect(() => {
    load()
  }, [])

  
  const create = async () => {
 await vehicleMonitorService.createSim({
  simid: Date.now().toString(),   // 🔥 REQUIRED
  simnumber: form.simnumber,
  phonenumber: form.phonenumber,
  iccidnumber: form.iccidnumber,
  operator: form.operator,
  expirydate: form.expirydate,
  countrycode: form.countrycode,
  statecode: form.statecode,
  locationid: form.locationid,
  baseunitid: form.baseunitid,
  active: form.active,
  createdby: "admin"   
})

   
   setForm({
  simnumber: '',
  phonenumber: '',
  iccidnumber: '',
  operator: '',
  expirydate: '',
  countrycode: '',
  statecode: '',
  locationid: '',
  baseunitid: '',
  active: true
})

    setSnack('SIM added successfully')
    load()
  }

 
  const openEdit = (row: any) => {
    setEditId(row.id)

   
   setEditForm({
  simnumber: row.simnumber || '',
  phonenumber: row.phonenumber || '',
  iccidnumber: row.iccidnumber || '',
  operator: row.operator || '',
  expirydate: row.expirydate || '',
  countrycode: row.countrycode || '',
  statecode: row.statecode || '',
  locationid: row.locationid || '',
  baseunitid: row.baseunitid || '',
  active: row.active ?? true
})

    setEditOpen(true)
  }

  
  const update = async () => {
    await vehicleMonitorService.updateSim(editId, editForm)

    setEditOpen(false)
    setSnack('SIM updated successfully')
    load()
  }

  
  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this SIM?')) return

    await vehicleMonitorService.deleteSim(id)

    setSnack('SIM deleted successfully')
    load()
  }

 
 const columns: GridColDef[] = [
  { field: 'simnumber', headerName: 'SIM Number', flex: 1 },
  { field: 'phonenumber', headerName: 'Phone', flex: 1 },
  { field: 'iccidnumber', headerName: 'ICCID', flex: 1 },
  { field: 'operator', headerName: 'Operator', flex: 1 },
  { field: 'countrycode', headerName: 'Country', flex: 1 },
  { field: 'statecode', headerName: 'State', flex: 1 },
  { field: 'locationid', headerName: 'Location', flex: 1 },
  { field: 'baseunitid', headerName: 'Base', flex: 1 },
  {
    field: 'active',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => (params.value ? 'ACTIVE' : 'INACTIVE')
  },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1,
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={1}>
        <Button size="small" onClick={() => openEdit(row)}>Edit</Button>
        <Button size="small" color="error" onClick={() => onDelete(row.id)}>Delete</Button>
      </Stack>
    )
  }
]

  return (
   <LocalizationProvider dateAdapter={AdapterDayjs}>
  <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      
    
      <Typography variant='h5' mb={2}>
        SIM Management
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}

     
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            
            <Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="SIM Number"
    value={form.simnumber}
    error={!form.simnumber}
  helperText={!form.simnumber ? "Required" : ""}
    onChange={(e) => setForm({ ...form, simnumber: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="Phone Number"
    value={form.phonenumber}
     error={!!form.phonenumber && !/^\d{10}$/.test(form.phonenumber)}
  helperText={
    form.phonenumber && !/^\d{10}$/.test(form.phonenumber)
      ? "Enter 10 digit phone number"
      : ""
  }
    onChange={(e) => setForm({ ...form, phonenumber: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="ICCID Number"
    value={form.iccidnumber}
    onChange={(e) => setForm({ ...form, iccidnumber: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="Operator"
    value={form.operator}
    onChange={(e) => setForm({ ...form, operator: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <DatePicker
    label="Expiry Date"
    value={form.expirydate ? dayjs(form.expirydate) : null}
    onChange={(newValue) =>
      setForm({
        ...form,
        expirydate: newValue ? newValue.format('YYYY-MM-DD') : ''
      })
    }
    slotProps={{
      textField: { fullWidth: true }
    }}
  />
</Grid>

<Grid item xs={12} md={3}>
  <Autocomplete
    options={Country.getAllCountries()}
    getOptionLabel={(option) => option.name}
    value={
      Country.getAllCountries().find(c => c.isoCode === form.countrycode) || null
    }
    onChange={(_, newValue) =>
      setForm({
        ...form,
        countrycode: newValue ? newValue.isoCode : '',
        statecode: ''
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="Country" fullWidth />
    )}
  />
</Grid>

<Grid item xs={12} md={3}>
  <Autocomplete
    options={State.getStatesOfCountry(form.countrycode)}
    getOptionLabel={(option) => option.name}
    value={
      State.getStatesOfCountry(form.countrycode).find(s => s.isoCode === form.statecode) || null
    }
    onChange={(_, newValue) =>
      setForm({
        ...form,
        statecode: newValue ? newValue.isoCode : ''
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="State" fullWidth />
    )}
    disabled={!form.countrycode}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="Location ID"
    value={form.locationid}
    onChange={(e) => setForm({ ...form, locationid: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="Base Unit ID"
    value={form.baseunitid}
    onChange={(e) => setForm({ ...form, baseunitid: e.target.value })}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    select
    fullWidth
    label="Status"
    value={String(form.active)}
    onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
  >
    <MenuItem value="true">Active</MenuItem>
    <MenuItem value="false">Inactive</MenuItem>
  </TextField>
</Grid>

       
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant='contained'
                sx={{ height: '56px' }}
                onClick={create}
              >
                Add SIM
              </Button>
            </Grid>

          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div style={{ height: 420 }}>
            <DataGrid rows={rows} columns={columns} />
          </div>
        </CardContent>
      </Card>

     
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>Edit SIM</DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="SIM Number"
      value={editForm.simnumber}
      onChange={(e) => setEditForm({ ...editForm, simnumber: e.target.value })}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="Phone Number"
      value={editForm.phonenumber}
      onChange={(e) => setEditForm({ ...editForm, phonenumber: e.target.value })}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="ICCID"
      value={editForm.iccidnumber}
      onChange={(e) => setEditForm({ ...editForm, iccidnumber: e.target.value })}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="Operator"
      value={editForm.operator}
      onChange={(e) => setEditForm({ ...editForm, operator: e.target.value })}
    />
  </Grid>

 <Grid item xs={12} md={3}>
  <DatePicker
    label="Expiry Date"
    value={form.expirydate ? dayjs(form.expirydate) : null}
    onChange={(newValue) =>
      setForm({
        ...form,
        expirydate: newValue ? newValue.format('YYYY-MM-DD') : ''
      })
    }
    slotProps={{
      textField: { fullWidth: true }
    }}
  />
</Grid>

 <Grid item xs={12} md={4}>
  <Autocomplete
    options={Country.getAllCountries()}
    getOptionLabel={(option) => option.name}
    value={
      Country.getAllCountries().find(c => c.isoCode === editForm.countrycode) || null
    }
    onChange={(_, newValue) =>
      setEditForm({
        ...editForm,
        countrycode: newValue ? newValue.isoCode : '',
        statecode: ''
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="Country" fullWidth />
    )}
  />
</Grid>

<Grid item xs={12} md={4}>
  <Autocomplete
    options={State.getStatesOfCountry(editForm.countrycode)}
    getOptionLabel={(option) => option.name}
    value={
      State.getStatesOfCountry(editForm.countrycode).find(s => s.isoCode === editForm.statecode) || null
    }
    onChange={(_, newValue) =>
      setEditForm({
        ...editForm,
        statecode: newValue ? newValue.isoCode : ''
      })
    }
    renderInput={(params) => (
      <TextField {...params} label="State" fullWidth />
    )}
    disabled={!editForm.countrycode}
  />
</Grid>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="Location ID"
      value={editForm.locationid}
      onChange={(e) => setEditForm({ ...editForm, locationid: e.target.value })}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <TextField fullWidth label="Base Unit ID"
      value={editForm.baseunitid}
      onChange={(e) => setEditForm({ ...editForm, baseunitid: e.target.value })}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <TextField
      select
      fullWidth
      label="Status"
      value={String(editForm.active)}
      onChange={(e) =>
        setEditForm({ ...editForm, active: e.target.value === 'true' })
      }
    >
      <MenuItem value="true">Active</MenuItem>
      <MenuItem value="false">Inactive</MenuItem>
    </TextField>
  </Grid>

</Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={update}>Update</Button>
        </DialogActions>
      </Dialog>

      
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}>
        <MuiAlert severity='success' variant='filled'>
          {snack}
        </MuiAlert>
      </Snackbar>
    </Box>
   </LocalizationProvider>
  )
}

export default SimManagement