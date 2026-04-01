import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const UserManagementApi = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', password: 'User@1234', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '' })
  const load = async () => { try { const [users, baseData] = await Promise.all([vehicleMonitorService.getUsers(), vehicleMonitorService.getBases()]); setRows((users.items || []).map((x: any) => ({ id: x._id, ...x }))); setBases(baseData.items || []) } catch (e: any) { setError(e?.error_message || 'Failed to load users') } }
  useEffect(() => { load() }, [])
  const create = async () => { await vehicleMonitorService.createUser({ username: form.username, password: form.password, name: { first: form.first, last: form.last }, contact: { mobile: form.mobile, email: form.email }, role: form.role, baseId: form.baseId }); load() }
  return <Box><Typography variant='h5' mb={2}>User Management</Typography>{error && <Alert severity='error'>{error}</Alert>}<Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={2}><TextField fullWidth label='Username' value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='First Name' value={form.first} onChange={e => setForm({ ...form, first: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Last Name' value={form.last} onChange={e => setForm({ ...form, last: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Mobile' value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth select label='Role' value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><MenuItem value='ADMIN'>ADMIN</MenuItem><MenuItem value='DRIVER'>DRIVER</MenuItem><MenuItem value='OPERATOR'>OPERATOR</MenuItem></TextField></Grid><Grid item xs={12} md={3}><TextField fullWidth select label='Base' value={form.baseId} onChange={e => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add User</Button></Grid></Grid></CardContent></Card><Card><CardContent><div style={{ height: 420 }}><DataGrid rows={rows} columns={[{ field: 'username', headerName: 'Username', flex: 1 }, { field: 'role', headerName: 'Role', flex: 1 }, { field: 'status', headerName: 'Status', flex: 1 }, { field: 'email', headerName: 'Email', flex: 1, valueGetter: (_, row) => row.contact?.email }]} /></div></CardContent></Card></Box>
}

export default UserManagementApi
