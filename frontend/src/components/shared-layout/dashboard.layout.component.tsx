import { ThemeProvider } from '@mui/material/styles'
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  AppBar,
  ListItemIcon,
  Toolbar,
  Tooltip,
  DialogContent,
  Dialog,
  Divider,
  createTheme,
} from '@mui/material'
import { styled, useTheme } from '@mui/system'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { themeModeState } from '../../states/state'
import { LocalStorageService } from '../../helpers/local-storage-service'
import {
  ArrowBack,
  Brightness4,
  Brightness7,
  ExpandLess,
  ExpandMore,
  SyncAltRounded,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop'
import LogoutIcon from '@mui/icons-material/Logout'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'

import ConfirmationModal from '../logout/logout.component'
import ProfileMenu from '../profilesetting'

// Icons for sidebar
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Logo } from '../../assets/images'


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#0000',
  padding: theme.spacing(1),
  textAlign: 'center',
  boxShadow: '0px 0px',
}))

const LoaderBackdrop = ({ openloader }: { openloader: boolean }) => (
  <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openloader}>
    <CircularProgress color="inherit" />
  </Backdrop>
)

const local_service: any = new LocalStorageService()

const DashboardContainer = styled(Box)({
  display: 'flex',
})

const MainContent = styled(Box)({
  flex: 1,
  padding: '1.5rem',
  marginLeft: 80,
  transition: 'margin-left 0.3s',
})

// Sidebar menu structure
const SIDEBAR_MENUS = [
  
  {
    label: 'User',
    name: 'User',
    icon: <PersonIcon fontSize="small" />,
    path: '/user',
    section: 'user',
  },
  {
    label: 'Master',
    name: 'Master',
    icon: <MenuBookIcon fontSize="small" />,
    path: '/bases',
    section: 'master',
  },

  {
    label: 'Vehicle',
    name: 'Vehicle',
    icon: <TrackChangesIcon fontSize="small" />,
    path: '/vehicles',
    section: 'master',
  },
  {
    label: 'Tracking',
    name: 'Tracking',
    icon: <TrackChangesIcon fontSize="small" />,
    path: '/tracking',
    section: 'tracking',
  },
  {
    label: 'Settings',
    name: 'Settings',
    icon: <SettingsIcon fontSize="small" />,
    path: '/settings',
    section: 'settings',
  },
]

const DashboardLayout = () => {
  const [mode, setMode] = useRecoilState(themeModeState)
  const [selectedMenu, setSelectedMenu] = useState('Dashboard')
  const [openloader, setOpenloader] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    user: true,
    master: true,
    tracking: false,
    settings: false,
  })

  const navigate = useNavigate()

  const handleModalClose = () => {
    setIsModalOpen(!isModalOpen)
  }

  const handleLogout = () => {
    navigate('/login')
    localStorage.clear()
    sessionStorage.clear()
  }

  const handleMenuClick = (menu: any) => {
    setSelectedMenu(menu.label)
    navigate(menu.path)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }



  
  useEffect(() => {
    const token = local_service.get_accesstoken()
    if (!token) {
      navigate('/login')
    }
  }, [navigate])


    const theme = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <LoaderBackdrop openloader={openloader} />
      
      {/* Header */}
      <AppBar
        position="sticky"
        sx={{
          minHeight: '8vh',
          height: '10vh',
          
          backgroundColor: mode === 'dark'  ? theme.palette.secondary.main
        : theme.palette.primary.main,
        }}
      >
        <Toolbar>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left side - Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton
                  onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                  color="inherit"
                  sx={{
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'rotate(180deg)' },
                  }}
                >
                  {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => window.location.reload()}
                  color="inherit"
                  sx={{
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'rotate(180deg)' },
                  }}
                >
                  <SyncAltRounded />
                </IconButton>
              </Tooltip>

              <Tooltip title="Go Back">
                <IconButton
                  onClick={() => window.history.back()}
                  color="inherit"
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Center - Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link to="/">
                <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                    <img
                   
                    src={Logo} alt="Logo" height={60} width={60} />
                {/* <Logo></Logo> */}
                </Typography>
              </Link>
            </Box>

            {/* Right side - Profile */}
            <ProfileMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Container */}
      <DashboardContainer>
        {/* Sidebar */}
        <Box
          sx={{
            width: 80,
            backgroundColor: mode === 'dark' ? '#0A1C2C' : '#1a2c3c',
            position: 'fixed',
            top: '10vh',
            left: 0,
            height: 'calc(100vh - 10vh)',
            overflowY: 'auto',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            transition: 'width 0.3s',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#0000',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: '4px',
            },
          }}
        >
          <List
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              textAlign: 'center',
              py: 2,
            }}
          >
            {SIDEBAR_MENUS.map((item, index) => (
              <ListItem
                button
                key={index}
                selected={selectedMenu === item.label}
                sx={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                  mx: 1,
                  mb: 1,
                  backgroundColor: selectedMenu === item.label 
                    ? (mode === 'dark' ? '#1e3a5f' : '#2c4c6c')
                    : '#0000',
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? '#1e3a5f' : '#2c4c6c',
                  },
                }}
                onClick={() => handleMenuClick(item)}
              >
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    color: selectedMenu === item.label 
                      ? '#fff' 
                      : (mode === 'dark' ? '#b0bec5' : '#c2d9ee'),
                    minWidth: 'auto',
                    mb: 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Typography
                  variant="caption"
                  sx={{
                    color: selectedMenu === item.label ? '#fff' : (mode === 'dark' ? '#b0bec5' : '#c2d9ee'),
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {item.name}
                </Typography>
              </ListItem>
            ))}

            <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />

            {/* Logout Button */}
            <ListItem
              button
              sx={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: 2,
                px: 1,
                borderRadius: 1,
                mx: 1,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? '#4a1a1a' : '#8b3a3a',
                },
              }}
              onClick={() => setIsModalOpen(true)}
            >
              <ListItemIcon
                sx={{
                  justifyContent: 'center',
                  color: '#f44336',
                  minWidth: 'auto',
                  mb: 1,
                }}
              >
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography
                variant="caption"
                sx={{
                  color: '#f44336',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                }}
              >
                Logout
              </Typography>
            </ListItem>
          </List>
        </Box>

        {/* Main Content */}
        <MainContent>
          <Outlet />
        </MainContent>

        {/* Logout Confirmation Modal */}
        {isModalOpen && (
          <ConfirmationModal
            isOpen={isModalOpen}
            message="Do you really want to logout?"
            handleConfirm={handleLogout}
            handleClose={handleModalClose}
            confirmBtnText="Logout"
            showIcon={true}
          />
        )}
      </DashboardContainer>
    </ThemeProvider>
  )
}

export default DashboardLayout