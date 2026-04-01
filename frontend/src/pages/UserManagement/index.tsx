import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Fab,
  Zoom,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  AccountCircle as AccountIcon,
  Business as BusinessIcon,
  SupervisorAccount as SupervisorIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// Types
interface User {
  id: string
  userId: string
  firstName: string
  lastName: string
  battalion: string
  reportingIncharge: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  department: string
  designation: string
  joinDate: Date
  lastLogin?: Date
  location: string
  profilePicture?: string
  permissions: string[]
}

// Mock Data
const mockUsers: User[] = [
  {
    id: '1',
    userId: 'IMP001',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    battalion: 'Alpha Battalion',
    reportingIncharge: 'Col. Amit Sharma',
    email: 'rajesh.kumar@impropay.com',
    phone: '+91 98765 43210',
    role: 'admin',
    status: 'active',
    department: 'Operations',
    designation: 'Senior Manager',
    joinDate: new Date('2023-01-15'),
    lastLogin: new Date('2024-03-15T10:30:00'),
    location: 'Mumbai',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  {
    id: '2',
    userId: 'IMP002',
    firstName: 'Priya',
    lastName: 'Sharma',
    battalion: 'Bravo Battalion',
    reportingIncharge: 'Lt. Col. Vikram Singh',
    email: 'priya.sharma@impropay.com',
    phone: '+91 98765 43211',
    role: 'manager',
    status: 'active',
    department: 'Finance',
    designation: 'Finance Manager',
    joinDate: new Date('2023-03-20'),
    lastLogin: new Date('2024-03-15T09:15:00'),
    location: 'Delhi',
    permissions: ['read', 'update'],
  },
  {
    id: '3',
    userId: 'IMP003',
    firstName: 'Amit',
    lastName: 'Patel',
    battalion: 'Charlie Battalion',
    reportingIncharge: 'Maj. Sanjay Gupta',
    email: 'amit.patel@impropay.com',
    phone: '+91 98765 43212',
    role: 'user',
    status: 'active',
    department: 'Technology',
    designation: 'Software Engineer',
    joinDate: new Date('2023-06-10'),
    lastLogin: new Date('2024-03-14T16:45:00'),
    location: 'Bangalore',
    permissions: ['read'],
  },
  {
    id: '4',
    userId: 'IMP004',
    firstName: 'Sunita',
    lastName: 'Reddy',
    battalion: 'Delta Battalion',
    reportingIncharge: 'Col. Meera Nair',
    email: 'sunita.reddy@impropay.com',
    phone: '+91 98765 43213',
    role: 'manager',
    status: 'active',
    department: 'HR',
    designation: 'HR Manager',
    joinDate: new Date('2023-08-05'),
    lastLogin: new Date('2024-03-15T11:20:00'),
    location: 'Hyderabad',
    permissions: ['read', 'update'],
  },
  {
    id: '5',
    userId: 'IMP005',
    firstName: 'Vikram',
    lastName: 'Singh',
    battalion: 'Echo Battalion',
    reportingIncharge: 'Brig. Arjun Mehta',
    email: 'vikram.singh@impropay.com',
    phone: '+91 98765 43214',
    role: 'user',
    status: 'inactive',
    department: 'Operations',
    designation: 'Field Officer',
    joinDate: new Date('2023-10-12'),
    lastLogin: new Date('2024-02-28T14:30:00'),
    location: 'Chennai',
    permissions: ['read'],
  },
  {
    id: '6',
    userId: 'IMP006',
    firstName: 'Neha',
    lastName: 'Verma',
    battalion: 'Foxtrot Battalion',
    reportingIncharge: 'Lt. Col. Rajiv Khanna',
    email: 'neha.verma@impropay.com',
    phone: '+91 98765 43215',
    role: 'viewer',
    status: 'pending',
    department: 'Compliance',
    designation: 'Compliance Officer',
    joinDate: new Date('2024-01-20'),
    location: 'Pune',
    permissions: ['read'],
  },
  {
    id: '7',
    userId: 'IMP007',
    firstName: 'Rahul',
    lastName: 'Mehta',
    battalion: 'Alpha Battalion',
    reportingIncharge: 'Col. Amit Sharma',
    email: 'rahul.mehta@impropay.com',
    phone: '+91 98765 43216',
    role: 'user',
    status: 'active',
    department: 'Technology',
    designation: 'Senior Developer',
    joinDate: new Date('2023-11-15'),
    lastLogin: new Date('2024-03-15T12:10:00'),
    location: 'Mumbai',
    permissions: ['read', 'update'],
  },
  {
    id: '8',
    userId: 'IMP008',
    firstName: 'Anjali',
    lastName: 'Nair',
    battalion: 'Bravo Battalion',
    reportingIncharge: 'Lt. Col. Vikram Singh',
    email: 'anjali.nair@impropay.com',
    phone: '+91 98765 43217',
    role: 'manager',
    status: 'active',
    department: 'Marketing',
    designation: 'Marketing Head',
    joinDate: new Date('2023-05-18'),
    lastLogin: new Date('2024-03-14T15:30:00'),
    location: 'Delhi',
    permissions: ['create', 'read', 'update'],
  },
]

// Styled Components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    cursor: 'pointer',
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light + '20',
  },
}))

const StatusChip = styled(Chip)(({ theme, status }: { theme?: any; status: string }) => {
  const colors = {
    active: { bg: '#4caf5020', color: '#4caf50' },
    inactive: { bg: '#f4433620', color: '#f44336' },
    pending: { bg: '#ff980020', color: '#ff9800' },
  }
  const color = colors[status as keyof typeof colors] || colors.active
  
  return {
    backgroundColor: color.bg,
    color: color.color,
    fontWeight: 'bold',
    '& .MuiChip-icon': {
      color: color.color,
    },
  }
})

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState<keyof User>('userId')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [battalionFilter, setBattalionFilter] = useState<string>('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' })
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    battalion: '',
    reportingIncharge: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    department: '',
    designation: '',
    location: '',
  })

  // Extract unique battalions for filter
  const battalions = ['all', ...new Set(users.map(u => u.battalion))]

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.battalion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.reportingIncharge.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesBattalion = battalionFilter === 'all' || user.battalion === battalionFilter
      
      return matchesSearch && matchesStatus && matchesRole && matchesBattalion
    })
    
    setFilteredUsers(filtered)
    setPage(0)
  }, [users, searchTerm, statusFilter, roleFilter, battalionFilter])

  // Sorting function
  const handleSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[orderBy]
      const bValue = b[orderBy]
      
      if (orderBy === 'joinDate' || orderBy === 'lastLogin') {
        return order === 'asc' 
          ? (aValue as Date).getTime() - (bValue as Date).getTime()
          : (bValue as Date).getTime() - (aValue as Date).getTime()
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })
  }, [filteredUsers, orderBy, order])

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', user?: User) => {
    setDialogMode(mode)
    if (user) {
      setSelectedUser(user)
      setFormData(user)
    } else {
      setSelectedUser(null)
      setFormData({
        firstName: '',
        lastName: '',
        battalion: '',
        reportingIncharge: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        department: '',
        designation: '',
        location: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedUser(null)
  }

  const handleSaveUser = () => {
    setLoading(true)
    setTimeout(() => {
      if (dialogMode === 'add') {
        const newUser: User = {
          id: Date.now().toString(),
          userId: `IMP${String(users.length + 1).padStart(3, '0')}`,
          ...formData as User,
          joinDate: new Date(),
          permissions: formData.role === 'admin' ? ['create', 'read', 'update', 'delete'] : ['read'],
        }
        setUsers([...users, newUser])
        setSnackbar({ open: true, message: 'User added successfully', type: 'success' })
      } else if (dialogMode === 'edit' && selectedUser) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u))
        setSnackbar({ open: true, message: 'User updated successfully', type: 'success' })
      }
      setLoading(false)
      handleCloseDialog()
    }, 500)
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId))
      setSnackbar({ open: true, message: 'User deleted successfully', type: 'success' })
    }
  }

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
    setSnackbar({ open: true, message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, type: 'success' })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon fontSize="small" />
      case 'manager': return <SupervisorIcon fontSize="small" />
      default: return <UsersIcon fontSize="small" />
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'active' ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    pending: users.filter(u => u.status === 'pending').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system users, roles, and permissions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>Total Users</Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <UsersIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>Active Users</Typography>
                  <Typography variant="h4" color="success.main">{stats.active}</Typography>
                </Box>
                <ActiveIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>Inactive Users</Typography>
                  <Typography variant="h4" color="error.main">{stats.inactive}</Typography>
                </Box>
                <InactiveIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>Pending</Typography>
                  <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                </Box>
                <InactiveIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>Administrators</Typography>
                  <Typography variant="h4" color="info.main">{stats.admins}</Typography>
                </Box>
                <AdminIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by User ID, Name, Battalion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Battalion</InputLabel>
              <Select
                value={battalionFilter}
                onChange={(e) => setBattalionFilter(e.target.value)}
                label="Battalion"
              >
                {battalions.map(battalion => (
                  <MenuItem key={battalion} value={battalion}>
                    {battalion === 'all' ? 'All' : battalion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('add')}
                fullWidth
              >
                Add User
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* User Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'userId'}
                  direction={orderBy === 'userId' ? order : 'asc'}
                  onClick={() => handleSort('userId')}
                >
                  User ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'firstName'}
                  direction={orderBy === 'firstName' ? order : 'asc'}
                  onClick={() => handleSort('firstName')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'battalion'}
                  direction={orderBy === 'battalion' ? order : 'asc'}
                  onClick={() => handleSort('battalion')}
                >
                  Battalion
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'reportingIncharge'}
                  direction={orderBy === 'reportingIncharge' ? order : 'asc'}
                  onClick={() => handleSort('reportingIncharge')}
                >
                  Reporting Incharge
                </TableSortLabel>
              </TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <StyledTableRow
                    key={user.id}
                    onClick={() => handleOpenDialog('view', user)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BadgeIcon color="primary" fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {user.userId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.designation}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<BusinessIcon />}
                        label={user.battalion}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SupervisorIcon fontSize="small" color="action" />
                        <Typography variant="body2">{user.reportingIncharge}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        icon={getStatusIcon(user.status)}
                        label={user.status.toUpperCase()}
                        status={user.status}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 12 }} /> {user.email}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 12 }} /> {user.phone}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDialog('edit', user)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(user.id)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={user.status === 'active' ? 'warning' : 'success'}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(user)
                        }}
                      >
                        {user.status === 'active' ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Add New User'}
          {dialogMode === 'edit' && 'Edit User'}
          {dialogMode === 'view' && 'User Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Battalion"
                value={formData.battalion}
                onChange={(e) => setFormData({ ...formData, battalion: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reporting Incharge"
                value={formData.reportingIncharge}
                onChange={(e) => setFormData({ ...formData, reportingIncharge: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.type as any} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Add */}
      <Zoom in={!openDialog}>
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenDialog('add')}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  )
}

export default UserManagement