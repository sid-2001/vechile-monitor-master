import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const UserManagementApi = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')

  const [form, setForm] = useState({ username: '', password: 'User@1234', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '' })
  const [editForm, setEditForm] = useState({ username: '', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '', status: 'ACTIVE' })

  const load = async () => {
    try {
      const [users, baseData] = await Promise.all([vehicleMonitorService.getUsers(), vehicleMonitorService.getBases()])
      setRows((users.items || []).map((x: any) => ({ id: x._id, ...x })))
      setBases(baseData.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load users')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    await vehicleMonitorService.createUser({
      username: form.username,
      password: form.password,
      name: { first: form.first, last: form.last },
      contact: { mobile: form.mobile, email: form.email },
      role: form.role,
      baseId: form.baseId
    })
    setForm({ username: '', password: 'User@1234', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '' })
    setSnack('User created successfully')
    load()
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
    setEditForm({
      username: row.username || '',
      first: row.name?.first || '',
      last: row.name?.last || '',
      mobile: row.contact?.mobile || '',
      email: row.contact?.email || '',
      role: row.role || 'OPERATOR',
      baseId: row.baseId?._id || row.baseId || '',
      status: row.status || 'ACTIVE'
    })
    setEditOpen(true)
  }

  const update = async () => {
    await vehicleMonitorService.updateUser(editId, {
      username: editForm.username,
      name: { first: editForm.first, last: editForm.last },
      contact: { mobile: editForm.mobile, email: editForm.email },
      role: editForm.role,
      baseId: editForm.baseId,
      status: editForm.status
    })
    setEditOpen(false)
    setSnack('User updated successfully')
    load()
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return
    await vehicleMonitorService.deleteUser(id)
    setSnack('User deleted successfully')
    load()
  }

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1, valueGetter: (_, row) => row.contact?.email },
    { field: 'actions', headerName: 'Actions', flex: 1, sortable: false, renderCell: ({ row }) => <Stack direction='row' spacing={1}><Button size='small' onClick={() => openEdit(row)}>Edit</Button><Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button></Stack> }
  ]

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>User Management</Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={2}><TextField fullWidth label='Username' value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='First Name' value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Last Name' value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Mobile' value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Role' value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><MenuItem value='ADMIN'>ADMIN</MenuItem><MenuItem value='DRIVER'>DRIVER</MenuItem><MenuItem value='OPERATOR'>OPERATOR</MenuItem></TextField></Grid><Grid item xs={12} md={3}><TextField fullWidth select label='Base' value={form.baseId} onChange={(e) => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add User</Button></Grid></Grid></CardContent></Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={columns} /></div></CardContent></Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label='Username' value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth select label='Role' value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}><MenuItem value='ADMIN'>ADMIN</MenuItem><MenuItem value='DRIVER'>DRIVER</MenuItem><MenuItem value='OPERATOR'>OPERATOR</MenuItem></TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label='First Name' value={editForm.first} onChange={(e) => setEditForm({ ...editForm, first: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label='Last Name' value={editForm.last} onChange={(e) => setEditForm({ ...editForm, last: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label='Mobile' value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label='Email' value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth select label='Base' value={editForm.baseId} onChange={(e) => setEditForm({ ...editForm, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label='Status' value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} /></Grid>
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

export default UserManagementApi
