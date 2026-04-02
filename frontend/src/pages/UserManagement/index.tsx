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
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Slide,
  Collapse,
  Backdrop,
  CircularProgress,
  alpha,
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
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material'
import { styled, keyframes } from '@mui/material/styles'

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

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
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    cursor: 'pointer',
    transform: 'translateX(4px)',
    '& .action-buttons': {
      opacity: 1,
    },
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}))

const StatusChip = styled(Chip)(({ theme, status }: { theme?: any; status: string }) => {
  const colors = {
    active: { bg: alpha('#4caf50', 0.12), color: '#2e7d32', icon: '#4caf50' },
    inactive: { bg: alpha('#f44336', 0.12), color: '#c62828', icon: '#f44336' },
    pending: { bg: alpha('#ff9800', 0.12), color: '#ed6c02', icon: '#ff9800' },
  }
  const color = colors[status as keyof typeof colors] || colors.active
  
  return {
    backgroundColor: color.bg,
    color: color.color,
    fontWeight: 600,
    borderRadius: '20px',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.02)',
    },
    '& .MuiChip-icon': {
      color: color.icon,
    },
  }
})

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}))

const GlassPaper = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
}))

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    borderRadius: '28px',
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    '&:hover': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
    },
  },
}))

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1) rotate(90deg)',
    boxShadow: theme.shadows[12],
  },
}))

const UserManagement: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10)
  const [orderBy, setOrderBy] = useState<keyof User>('userId')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [battalionFilter, setBattalionFilter] = useState<string>('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' })
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [showFilters, setShowFilters] = useState(!isMobile)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

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
    
    // Simulate loading for smooth transition
    setLoading(true)
    setTimeout(() => {
      setFilteredUsers(filtered)
      setLoading(false)
    }, 300)
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
        setUsers([newUser, ...users])
        setSnackbar({ open: true, message: 'User added successfully', type: 'success' })
      } else if (dialogMode === 'edit' && selectedUser) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u))
        setSnackbar({ open: true, message: 'User updated successfully', type: 'success' })
      }
      setLoading(false)
      handleCloseDialog()
    }, 500)
  }

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete))
      setSnackbar({ open: true, message: 'User deleted successfully', type: 'success' })
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
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
    return status === 'active' ? <ActiveIcon fontSize="small" /> : status === 'inactive' ? <InactiveIcon fontSize="small" /> : <WarningAmberIcon fontSize="small" />
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    pending: users.filter(u => u.status === 'pending').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  const statCards = [
    { title: 'Total Users', value: stats.total, icon: <UsersIcon />, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) },
    { title: 'Active Users', value: stats.active, icon: <ActiveIcon />, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.1) },
    { title: 'Inactive Users', value: stats.inactive, icon: <InactiveIcon />, color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.1) },
    { title: 'Pending', value: stats.pending, icon: <WarningAmberIcon />, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) },
    { title: 'Administrators', value: stats.admins, icon: <AdminIcon />, color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.1) },
  ]

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 }, 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
    }}>
      {/* Animated Header */}
      <Fade in timeout={800}>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              animation: `${fadeInUp} 0.6s ease-out`,
            }}
          >
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ animation: `${fadeInUp} 0.6s ease-out 0.1s both` }}>
            Manage system users, roles, and permissions with ease
          </Typography>
        </Box>
      </Fade>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={stat.title}>
            <Grow in timeout={400 + index * 100}>
              <AnimatedCard elevation={0} sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 3, 
                      bgcolor: stat.bg,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 28 } })}
                    </Box>
                  </Box>
                </CardContent>
              </AnimatedCard>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Search and Filters */}
      <GlassPaper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <SearchTextField
              fullWidth
              placeholder="Search by User ID, Name, Battalion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {isMobile && (
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters {showFilters ? '▲' : '▼'}
              </Button>
            </Grid>
          )}
          
          <Grid item xs={isMobile ? 6 : 12} md={isMobile ? 6 : 8}>
            <Stack direction="row" spacing={1} justifyContent={isMobile ? "flex-end" : "flex-start"}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('add')}
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[6],
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isMobile ? 'Add' : 'Add User'}
              </Button>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={() => {
                    setUsers(mockUsers)
                    setSnackbar({ open: true, message: 'Data refreshed', type: 'info' })
                  }}
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'rotate(180deg)' },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>

        <Collapse in={showFilters}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Battalion</InputLabel>
                <Select
                  value={battalionFilter}
                  onChange={(e) => setBattalionFilter(e.target.value)}
                  label="Battalion"
                  sx={{ borderRadius: 2 }}
                >
                  {battalions.map(battalion => (
                    <MenuItem key={battalion} value={battalion}>
                      {battalion === 'all' ? 'All' : battalion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </GlassPaper>

      {/* User Table */}
      <GlassPaper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === 'userId'}
                    direction={orderBy === 'userId' ? order : 'asc'}
                    onClick={() => handleSort('userId')}
                  >
                    User ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === 'firstName'}
                    direction={orderBy === 'firstName' ? order : 'asc'}
                    onClick={() => handleSort('firstName')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                {!isTablet && (
                  <>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <TableSortLabel
                        active={orderBy === 'battalion'}
                        direction={orderBy === 'battalion' ? order : 'asc'}
                        onClick={() => handleSort('battalion')}
                      >
                        Battalion
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <TableSortLabel
                        active={orderBy === 'reportingIncharge'}
                        direction={orderBy === 'reportingIncharge' ? order : 'asc'}
                        onClick={() => handleSort('reportingIncharge')}
                      >
                        Reporting Incharge
                      </TableSortLabel>
                    </TableCell>
                  </>
                )}
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {!isTablet && <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isTablet ? 6 : 8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">Loading users...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isTablet ? 6 : 8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <InfoOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">No users found</Typography>
                      <Button 
                        variant="text" 
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                          setRoleFilter('all')
                          setBattalionFilter('all')
                        }}
                      >
                        Clear filters
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user, index) => (
                    <Grow in timeout={300 + index * 50} key={user.id}>
                      <StyledTableRow
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                width: 36, 
                                height: 36, 
                                bgcolor: alpha(theme.palette.primary.main, 0.9),
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'scale(1.05)' },
                              }}
                            >
                              {user.firstName[0]}{user.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {user.firstName} {user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.designation}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {!isTablet && (
                          <>
                            <TableCell>
                              <Chip
                                icon={<BusinessIcon />}
                                label={user.battalion}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SupervisorIcon fontSize="small" color="action" />
                                <Typography variant="body2">{user.reportingIncharge}</Typography>
                              </Box>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role.toUpperCase()}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 2, fontWeight: 500 }}
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
                        {!isTablet && (
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
                        )}
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center" className="action-buttons" sx={{ transition: 'opacity 0.2s ease' }}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenDialog('view', user)
                                }}
                                sx={{ '&:hover': { color: theme.palette.info.main } }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenDialog('edit', user)
                                }}
                                sx={{ '&:hover': { color: theme.palette.warning.main } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleStatus(user)
                                }}
                                sx={{ '&:hover': { color: user.status === 'active' ? theme.palette.error.main : theme.palette.success.main } }}
                              >
                                {user.status === 'active' ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(user.id)
                                }}
                                sx={{ '&:hover': { color: theme.palette.error.main } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </StyledTableRow>
                    </Grow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
        />
      </GlassPaper>

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        <Box sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white', 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant="h6" fontWeight="bold">
            {dialogMode === 'add' && 'Add New User'}
            {dialogMode === 'edit' && 'Edit User'}
            {dialogMode === 'view' && 'User Details'}
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={dialogMode === 'view'}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  label="Role"
                  sx={{ borderRadius: 2 }}
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
                  sx={{ borderRadius: 2 }}
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
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                disabled={dialogMode === 'view'}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={dialogMode === 'view'}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          {dialogMode !== 'view' && (
            <Button 
              onClick={handleSaveUser} 
              variant="contained" 
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: theme.palette.error.main, mb: 1 }} />
          <Typography variant="h6">Confirm Delete</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography textAlign="center" color="text.secondary">
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Alert 
          severity={snackbar.type as any} 
          variant="filled"
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[6],
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Add */}
      <Zoom in={!openDialog && !deleteConfirmOpen}>
        <StyledFab color="primary" onClick={() => handleOpenDialog('add')}>
          <AddIcon />
        </StyledFab>
      </Zoom>
    </Box>
  )
}

export default UserManagement