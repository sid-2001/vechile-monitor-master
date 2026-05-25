import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { useTheme } from '@emotion/react'

const UserManagementApi = () => {
  const [rows, setRows] = useState<any[]>([])
  const [bases, setBases] = useState<any[]>([])
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingBases, setLoadingBases] = useState(false)
  const theme=useTheme();
  const [nameSearch, setNameSearch] = useState('')
  const [idSearch, setIdSearch] = useState('')

  const [form, setForm] = useState({ username: '', password: 'User@1234', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '' })
  const [editForm, setEditForm] = useState({ username: '', first: '', last: '', mobile: '', email: '', role: 'OPERATOR', baseId: '', status: 'ACTIVE' })

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await vehicleMonitorService.getUsers()
      setRows((users.items || []).map((x: any) => ({ id: x._id, ...x })))
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadBases = async () => {
    setLoadingBases(true)
    try {
      const baseData = await vehicleMonitorService.getBases()
      setBases(baseData.items || [])
      setError('')
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load bases')
    } finally {
      setLoadingBases(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadBases()
  }, [])

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
    await loadUsers()
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
    await loadUsers()
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return
    await vehicleMonitorService.deleteUser(id)
    setSnack('User deleted successfully')
    await loadUsers()
  }

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1, valueGetter: (_, row) => row.contact?.email },
    { field: 'actions', headerName: 'Actions', flex: 1, sortable: false, renderCell: ({ row }) => <Stack direction='row' spacing={1}><Button size='small' onClick={() => openEdit(row)}>Edit</Button><Button size='small' color='error' onClick={() => onDelete(row.id)}>Delete</Button></Stack> }
  ]

  const scoreMatch = (value: string, query: string) => {
    if (!query) return 1
    const source = (value || '').toLowerCase()
    const target = query.toLowerCase().trim()
    if (!source || !target) return 0
    if (source === target) return 100
    if (source.startsWith(target)) return 80
    if (source.includes(target)) return 60
    return target.split(/\s+/).reduce((score, part) => (source.includes(part) ? score + 10 : score), 0)
  }

  const filteredRows = useMemo(() => {
    const hasNameSearch = !!nameSearch.trim()
    const hasIdSearch = !!idSearch.trim()
    return rows
      .map((row) => {
        const fullName = `${row?.name?.first || ''} ${row?.name?.last || ''}`.trim()
        const idValue = row.username || row._id || row.id || ''
        const nameScore = hasNameSearch ? scoreMatch(fullName, nameSearch) : 1
        const idScore = hasIdSearch ? scoreMatch(String(idValue), idSearch) : 1
        return { ...row, __score: nameScore + idScore }
      })
      .filter((row) => row.__score > 0)
      .sort((a, b) => b.__score - a.__score)
  }, [rows, nameSearch, idSearch])

  const exportCsv = () => {
    const csvRows = filteredRows.map((row) => ({
      id: row.username || row._id || row.id || '',
      firstName: row?.name?.first || '',
      lastName: row?.name?.last || '',
      role: row.role || '',
      status: row.status || '',
      email: row?.contact?.email || '',
      mobile: row?.contact?.mobile || '',
    }))
    const header = ['ID Number', 'First Name', 'Last Name', 'Role', 'Status', 'Email', 'Mobile']
    const dataLines = csvRows.map((r) => [r.id, r.firstName, r.lastName, r.role, r.status, r.email, r.mobile].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[header.join(','), ...dataLines].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportXlsx = () => {
    const rowsHtml = filteredRows.map((row) => `<tr><td>${row.username || row._id || row.id || ''}</td><td>${row?.name?.first || ''}</td><td>${row?.name?.last || ''}</td><td>${row.role || ''}</td><td>${row.status || ''}</td><td>${row?.contact?.email || ''}</td><td>${row?.contact?.mobile || ''}</td></tr>`).join('')
    const table = `<table><tr><th>ID Number</th><th>First Name</th><th>Last Name</th><th>Role</th><th>Status</th><th>Email</th><th>Mobile</th></tr>${rowsHtml}</table>`
    const blob = new Blob([table], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>User Managements</Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <Card sx={{ mb: 2 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={2}><TextField fullWidth label='Username' value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='First Name' value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Last Name' value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Mobile' value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Grid><Grid item xs={12} md={2}><TextField fullWidth label='Email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
      
<Grid item xs={12} md={2}>
  <TextField 
    fullWidth 
    select 
    label='Role' 
    value={form.role} 
    onChange={(e) => setForm({ ...form, role: e.target.value })}
    sx={{
'& .MuiSelect-icon': {
      color: 'white', // White arrow icon
    },

    }}
   
     SelectProps={{
    MenuProps: {
      PaperProps: {
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'white',
          '& .MuiMenuItem-root': {
            color: theme.palette.mode === 'dark' ? 'white' : 'black',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
    },
  }}
  >
    <MenuItem value='ADMIN'>ADMIN</MenuItem>
    <MenuItem value='DRIVER'>DRIVER</MenuItem>
    <MenuItem value='OPERATOR'>OPERATOR</MenuItem>
  </TextField>
</Grid>
      
      <Grid item xs={12} md={3}>
        
        
        <TextField fullWidth select 
        
            sx={{
'& .MuiSelect-icon': {
      color: 'white', // White arrow icon
    },

    }}
   
     SelectProps={{
    MenuProps: {
      PaperProps: {
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'white',
          '& .MuiMenuItem-root': {
            color: theme.palette.mode === 'dark' ? 'white' : 'black',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
    },
  }}
        
        label='Base' value={form.baseId} onChange={(e) => setForm({ ...form, baseId: e.target.value })}>{bases.map((b: any) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={2}><Button fullWidth variant='contained' sx={{ height: '56px' }} onClick={create}>Add User</Button></Grid></Grid>
        
        
        </CardContent></Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Search Name' value={nameSearch} autoComplete='off' onChange={(e) => setNameSearch(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Search ID Number' value={idSearch} autoComplete='off' onChange={(e) => setIdSearch(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant='outlined' onClick={exportCsv}>Download CSV</Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant='outlined' onClick={exportXlsx}>Download XLSX</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card><CardContent><div style={{ height: 420 }}><DataGrid rows={filteredRows} columns={columns} loading={loadingUsers || loadingBases} /></div></CardContent></Card>

      <Dialog 
      
    
      
      open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth='md'>
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
