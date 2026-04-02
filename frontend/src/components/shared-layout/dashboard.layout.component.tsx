import { ThemeProvider, useTheme } from '@mui/material/styles'
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  AppBar,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Divider,
  Drawer,
  useMediaQuery,
} from '@mui/material'
import { styled } from '@mui/system'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { themeModeState } from '../../states/state'
import { LocalStorageService } from '../../helpers/local-storage-service'
import { ArrowBack, Brightness4, Brightness7, Menu as MenuIcon, SyncAltRounded } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import LogoutIcon from '@mui/icons-material/Logout'
import ProfileMenu from '../profilesetting'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Logo } from '../../assets/images'
import ConfirmationModal from '../logout/logout.component'

const local_service: any = new LocalStorageService()
const DRAWER_WIDTH = 250

const MainContent = styled(Box)({
  flex: 1,
  padding: '1.25rem',
  '@media (min-width: 900px)': {
    marginLeft: 80,
    padding: '1.5rem'
  }
})

const SIDEBAR_MENUS = [
  { label: 'User', name: 'User', icon: <PersonIcon fontSize='small' />, path: '/user' },
  { label: 'Master', name: 'Master', icon: <MenuBookIcon fontSize='small' />, path: '/bases' },
  { label: 'Vehicle', name: 'Vehicle', icon: <TrackChangesIcon fontSize='small' />, path: '/vehicles' },
  { label: 'Onboard Devices', name: 'Onboard Devices', icon: <TrackChangesIcon fontSize='small' />, path: '/devices' },
  { label: 'Tracking', name: 'Tracking', icon: <TrackChangesIcon fontSize='small' />, path: '/tracking' },
  { label: 'Settings', name: 'Settings', icon: <SettingsIcon fontSize='small' />, path: '/settings' },
]

const DashboardLayout = () => {
  const [mode, setMode] = useRecoilState(themeModeState)
  const [selectedMenu, setSelectedMenu] = useState('Tracking')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    const token = local_service.get_accesstoken()
    if (!token) navigate('/login')
  }, [navigate])

  const handleMenuClick = (menu: any) => {
    setSelectedMenu(menu.label)
    navigate(menu.path)
    if (isMobile) setMobileOpen(false)
  }

  const renderMenuList = (compact = false) => (
    <List sx={{ py: 1 }}>
      {SIDEBAR_MENUS.map((item, index) => (
        <ListItem
          key={index}
          onClick={() => handleMenuClick(item)}
          sx={{
            cursor: 'pointer',
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
            justifyContent: compact ? 'center' : 'flex-start',
            backgroundColor: selectedMenu === item.label ? (mode === 'dark' ? '#1e3a5f' : '#dbeafe') : 'transparent',
            '&:hover': { backgroundColor: mode === 'dark' ? '#1e3a5f' : '#e2e8f0' }
          }}
        >
          <ListItemIcon sx={{ minWidth: compact ? 'auto' : 36, color: mode === 'dark' ? '#e2e8f0' : '#0f172a' }}>{item.icon}</ListItemIcon>
          {!compact && <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />}
        </ListItem>
      ))}
      <Divider sx={{ my: 1 }} />
      <ListItem onClick={() => setIsModalOpen(true)} sx={{ cursor: 'pointer', borderRadius: 2, mx: 1, color: '#ef4444' }}>
        <ListItemIcon sx={{ minWidth: compact ? 'auto' : 36, color: '#ef4444' }}><LogoutIcon fontSize='small' /></ListItemIcon>
        {!compact && <ListItemText primary='Logout' />}
      </ListItem>
    </List>
  )

  return (
    <ThemeProvider theme={theme}>
      <AppBar
        position='sticky'
        sx={{
          minHeight: '64px',
          backgroundColor: mode === 'dark' ? theme.palette.secondary.main : theme.palette.primary.main,
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', px: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton color='inherit' onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color='inherit'>
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <>
                <Tooltip title='Refresh'>
                  <IconButton onClick={() => window.location.reload()} color='inherit'><SyncAltRounded /></IconButton>
                </Tooltip>
                <Tooltip title='Go Back'>
                  <IconButton onClick={() => window.history.back()} color='inherit'><ArrowBack /></IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Link to='/'><img src={Logo} alt='Logo' height={48} width={48} /></Link>
          </Box>

          <ProfileMenu />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex' }}>
        {!isMobile && (
          <Box
            sx={{
              width: 80,
              backgroundColor: mode === 'dark' ? '#0A1C2C' : '#f8fafc',
              position: 'fixed',
              top: 64,
              left: 0,
              height: 'calc(100vh - 64px)',
              borderRight: '1px solid rgba(148,163,184,0.3)',
              zIndex: 1200,
            }}
          >
            {renderMenuList(true)}
          </Box>
        )}

        <Drawer anchor='left' open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }}>
          <Box sx={{ width: DRAWER_WIDTH, bgcolor: mode === 'dark' ? '#0A1C2C' : '#fff', height: '100%' }}>
            <Box sx={{ p: 2 }}><Typography variant='h6'>Menu</Typography></Box>
            {renderMenuList(false)}
          </Box>
        </Drawer>

        <MainContent>
          <Outlet />
        </MainContent>

        {isModalOpen && (
          <ConfirmationModal
            isOpen={isModalOpen}
            message='Do you really want to logout?'
            handleConfirm={() => {
              navigate('/login')
              localStorage.clear()
              sessionStorage.clear()
            }}
            handleClose={() => setIsModalOpen(false)}
            confirmBtnText='Logout'
            showIcon={true}
          />
        )}
      </Box>
    </ThemeProvider>
  )
}

export default DashboardLayout
