import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../services/vehicle-monitor.service'

const MODULES = [
  ['dashboard', 'Dashboard'], ['users', 'User'], ['roles', 'Role'], ['locations', 'Location'], ['geofences', 'Base Geofencing'],
  ['bases', 'Base Unit'], ['vehicles', 'Vehicle'], ['devices', 'Device'], ['sims', 'SIM Master'], ['kilometerCards', 'Kilometer Card'],
  ['deviceSimMapping', 'Device-SIM Mapping'], ['tracking', 'Live Tracking'], ['locationHistory', 'Vehicle History'], ['analytics', 'Analytics'],
  ['loginDevices', 'Login Devices'], ['testSignals', 'Test Signals'], ['haltConfiguration', 'Halt Configuration'],
]
const ACCESS = ['NONE', 'READ', 'WRITE', 'UPDATE', 'DELETE', 'FULL']
const defaultPermissions = () => Object.fromEntries(MODULES.map(([key]) => [key, 'NONE']))

const RoleManagement = () => {
  const [rows, setRows] = useState<any[]>([])
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState<any>({ name: '', description: '', status: 'ACTIVE', permissions: defaultPermissions() })

  const load = async () => {
    const data = await vehicleMonitorService.getRoles()
    setRows((data.items || []).map((role: any) => ({ id: role._id, ...role, permissions: role.permissions || {} })))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (editId) {
      await vehicleMonitorService.updateRole(editId, form)
      setSnack('Role updated successfully')
    } else {
      await vehicleMonitorService.createRole(form)
      setSnack('Role created successfully')
    }
    setEditOpen(false)
    setEditId('')
    setForm({ name: '', description: '', status: 'ACTIVE', permissions: defaultPermissions() })
    load()
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
    setForm({ name: row.name || '', description: row.description || '', status: row.status || 'ACTIVE', permissions: { ...defaultPermissions(), ...(row.permissions || {}) } })
    setEditOpen(true)
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this role?')) return
    await vehicleMonitorService.deleteRole(id)
    setSnack('Role deleted successfully')
    load()
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Role Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'actions', headerName: 'Actions', flex: 1, sortable: false, renderCell: ({ row }) => <Stack direction='row' spacing={1}><Button size='small' onClick={() => openEdit(row)}>Edit</Button><Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button></Stack> },
  ]

  return <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
    <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}><Typography variant='h5'>Role Management</Typography><Button variant='contained' onClick={() => setEditOpen(true)}>Create Role</Button></Stack>
    <Card><CardContent><Box sx={{ height: 460 }}><DataGrid rows={rows} columns={columns} disableRowSelectionOnClick /></Box></CardContent></Card>
    <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md'>
      <DialogTitle>{editId ? 'Edit Role' : 'Create Role'}</DialogTitle>
      <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}><TextField fullWidth label='Role Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth select label='Status' value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><MenuItem value='ACTIVE'>ACTIVE</MenuItem><MenuItem value='INACTIVE'>INACTIVE</MenuItem></TextField></Grid>
        <Grid item xs={12}><TextField fullWidth label='Description' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
        {MODULES.map(([key, label]) => <Grid item xs={12} md={4} key={key}><TextField fullWidth select label={label} value={form.permissions[key]} onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [key]: e.target.value } })}>{ACCESS.map((access) => <MenuItem key={access} value={access}>{access}</MenuItem>)}</TextField></Grid>)}
      </Grid></DialogContent>
      <DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button variant='contained' onClick={save} disabled={!form.name}>Save</Button></DialogActions>
    </Dialog>
    <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}><MuiAlert severity='success' variant='filled'>{snack}</MuiAlert></Snackbar>
  </Box>
}
export default RoleManagement
