import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import LogoutIcon from '@mui/icons-material/Logout'
import DevicesIcon from '@mui/icons-material/Devices'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

type LoginDevice = {
  _id: string
  username: string
  role: string
  deviceName?: string
  ipAddress?: string
  location?: { latitude?: number; longitude?: number; accuracy?: number }
  timezone?: string
  lastLoginTime?: string
  lastSeenAt?: string
  active: boolean
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '-')
const formatLocation = (row: LoginDevice) => {
  const lat = row.location?.latitude
  const lng = row.location?.longitude
  if (lat === undefined || lng === undefined) return 'Location not shared'
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
}

const LoginDevices = () => {
  const [rows, setRows] = useState<LoginDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadDevices = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await vehicleMonitorService.getLoginDevices()
      setRows(data.items || [])
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load login devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  const logoutDevice = async (id: string) => {
    await vehicleMonitorService.logoutLoginDevice(id)
    setMessage('Device logged out successfully')
    loadDevices()
  }

  const logoutAllDevices = async () => {
    await vehicleMonitorService.logoutAllLoginDevices()
    setMessage('All devices logged out successfully')
    loadDevices()
  }

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'User', flex: 1, minWidth: 130 },
    { field: 'role', headerName: 'Role', width: 110 },
    { field: 'deviceName', headerName: 'Device', flex: 1.6, minWidth: 240, valueGetter: (_, row) => row.deviceName || 'Unknown device' },
    { field: 'ipAddress', headerName: 'IP Address', flex: 0.8, minWidth: 140, valueGetter: (_, row) => row.ipAddress || '-' },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 180, valueGetter: (_, row) => formatLocation(row) },
    { field: 'timezone', headerName: 'Timezone', flex: 0.9, minWidth: 150, valueGetter: (_, row) => row.timezone || '-' },
    { field: 'lastLoginTime', headerName: 'Last Login', flex: 1, minWidth: 180, valueGetter: (_, row) => formatDate(row.lastLoginTime) },
    { field: 'lastSeenAt', headerName: 'Last Seen', flex: 1, minWidth: 180, valueGetter: (_, row) => formatDate(row.lastSeenAt) },
    {
      field: 'active',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <Chip size='small' color={params.row.active ? 'success' : 'default'} label={params.row.active ? 'Active' : 'Logged out'} />,
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button size='small' color='error' startIcon={<LogoutIcon />} disabled={!params.row.active} onClick={() => logoutDevice(params.row._id)}>
          Logout
        </Button>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={2}>
        <Box>
          <Typography variant='h4' display='flex' alignItems='center' gap={1}><DevicesIcon /> Login Devices</Typography>
          <Typography variant='body2' color='text.secondary'>Admin view of all active login devices, locations, and last login times.</Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={loadDevices}>Refresh</Button>
          <Button variant='contained' color='error' startIcon={<LogoutIcon />} onClick={logoutAllDevices}>Logout All Devices</Button>
        </Stack>
      </Stack>
      {message && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <CardContent>
          <Box sx={{ height: 620, width: '100%' }}>
            <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} loading={loading} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginDevices
