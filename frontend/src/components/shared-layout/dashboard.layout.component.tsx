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
  Drawer,
  useMediaQuery,
} from '@mui/material'
import MemoryIcon from "@mui/icons-material/Memory";
import HomeIcon from "@mui/icons-material/Home";
import { Menu, MenuItem } from "@mui/material";
import { Grid } from "@mui/material";
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
  Menu as MenuIcon,
  LocationSearching,
  DeveloperBoard,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop'
import LogoutIcon from '@mui/icons-material/Logout'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

import ConfirmationModal from '../logout/logout.component'
import ProfileMenu from '../profilesetting'

// Icons for sidebar
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Logo } from '../../assets/images'
import RefreshIcon from '@mui/icons-material/Refresh';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import PolylineIcon from '@mui/icons-material/Polyline';
import TimelineIcon from '@mui/icons-material/Timeline';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import InsightsIcon from '@mui/icons-material/Insights';
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: 'transparent',
  padding: theme.spacing(1),
  textAlign: 'center',
  boxShadow: 'none',
}))

const LoaderBackdrop = ({ openloader }: { openloader: boolean }) => (
  <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openloader}>
    <CircularProgress color="inherit" />
  </Backdrop>
)

const local_service: any = new LocalStorageService()

const DashboardContainer = styled(Box)({
  display: 'flex',
  minHeight: 'calc(100vh - 10vh)',
})

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  transition: 'margin-left 0.3s',
  marginLeft: 80,
  width: 'calc(100% - 80px)',
  overflowX: 'auto',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    padding: theme.spacing(2),
    width: '100%',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
}))

// Sidebar menu structure
const SIDEBAR_MENUS = [
  { label: 'Dashboard', name: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/', },

  { label: 'User', name: 'User', icon: <PersonIcon fontSize="small" />, path: '/user' },

  { label: 'Location', name: 'Location', icon: <LocationSearchingIcon fontSize="small" />, path: '/location' },
    { label: 'Base Geofencing', name: 'Base Geo', icon: <PolylineIcon fontSize="small" />, path: '/geofence' },


  { label: 'Base Unit', name: 'Base Unit', icon: <HomeIcon fontSize="small" />, path: '/bases' },


  // { label: 'Location-Base Mapping', name: 'Loc-Base Map', icon: <SyncAltRounded fontSize="small" />, path: '/location-base-mapping' },

  { label: 'Vehicle', name: 'Vehicle', icon: <DirectionsBusIcon fontSize="small" />, path: '/vehicles' },

  { label: 'Device', name: 'Device', icon: <MemoryIcon fontSize="small" />, path: '/devices' },

  { label: 'SIM Master', name: 'SIM Master', icon: <DeveloperBoardIcon fontSize="small" />, path: '/sims' },

  { label: 'Device-SIM Mapping', name: 'Dev-SIM Map', icon: <SyncAltRounded fontSize="small" />, path: '/device-sim-mapping' },

  // { label: 'Vehicle-Device Mapping', name: 'Veh-Dev Map', icon: <SyncAltRounded fontSize="small" />, path: '/vehicle-device-mapping' },

  // { label: 'Base-Vehicle Mapping', name: 'Base-Veh Map', icon: <SyncAltRounded fontSize="small" />, path: '/base-vehicle-mapping' },

  { label: 'Live Tracking', name: 'Live Track', icon: <TrackChangesIcon fontSize="small" />, path: '/tracking' },

  { label: 'Vehicle History', name: 'History', icon: <TimelineIcon fontSize="small" />, path: '/location-history' },

  { label: 'Analytics', name: 'Analytics', icon: <InsightsIcon fontSize="small" />, path: '/analytics' },
]

const DashboardLayout = () => {
  const [mode, setMode] = useRecoilState(themeModeState)
  const [selectedMenu, setSelectedMenu] = useState('Dashboard')
  const [openloader, setOpenloader] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    user: true,
    master: true,
    tracking: false,
    settings: false,
  })
  const [openMasterModal, setOpenMasterModal] = useState(false);
  const [masterAnchor , setMasterAnchor] = useState<null | HTMLElement>(null);


  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleModalClose = () => {
    setIsModalOpen(!isModalOpen)
  }

  const handleLogout = () => {
    navigate('/login')
    localStorage.clear()
    sessionStorage.clear()
  }

 

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      //@ts-ignore
      [section]: !prev[section]
    }))
  }

const handleMenuClick = (menu: any) => {
  if (menu.label === "Master") {
    setOpenMasterModal(true);
    return;
  }

  setSelectedMenu(menu.label);
  navigate(menu.path);

  if (isMobile) {
    setMobileDrawerOpen(false);
  }
};

  useEffect(() => {
    const token = local_service.get_accesstoken()
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  // Sidebar Content Component (reused for both desktop and mobile)
  const SidebarContent = () => (
    <Box
      sx={{
        width: isMobile ? 240 : 80,
        height: '100%',
        backgroundColor: mode === 'dark' 
          ? theme.palette.background.paper 
          : theme.palette.primary.dark,
        overflowY: 'auto',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#aaa',
          borderRadius: '4px',
        },
      }}
    >
      <List
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          textAlign: isMobile ? 'left' : 'center',
          py: 2,
        }}
      >
        {SIDEBAR_MENUS.map((item, index) => (
          <ListItem
            button
            key={index}
            selected={selectedMenu === item.label}
            sx={{
              flexDirection: isMobile ? 'row' : 'column',
              justifyContent: isMobile ? 'flex-start' : 'center',
              alignItems: 'center',
              py: isMobile ? 1.5 : 2,
              px: isMobile ? 2 : 1,
              borderRadius: 1,
              mx: isMobile ? 1 : 1,
              mb: 1,
              gap: isMobile ? 2 : 0,
              backgroundColor: selectedMenu === item.label 
                ? (mode === 'dark' 
                    ? theme.palette.action.selected 
                    : theme.palette.action.hover)
                : 'transparent',
              '&:hover': {
                backgroundColor: mode === 'dark' 
                  ? theme.palette.action.hover 
                  : theme.palette.action.selected,
              },
            }}
            // @ts-ignore
            onClick={(e) => handleMenuClick(item, e)}
          >
            <ListItemIcon
              sx={{
                justifyContent: 'center',
                color: selectedMenu === item.label 
                  ? theme.palette.primary.contrastText 
                  : (mode === 'dark' 
                      ? theme.palette.text.secondary 
                      : theme.palette.grey[300]),
                minWidth: 'auto',
                mb: isMobile ? 0 : 1,
                mr: isMobile ? 2 : 0,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <Typography
              variant={isMobile ? "body2" : "caption"}
              sx={{
                color: selectedMenu === item.label 
                  ? theme.palette.primary.contrastText 
                  : (mode === 'dark' 
                      ? theme.palette.text.secondary 
                      : theme.palette.grey[300]),
                fontSize: isMobile ? '0.875rem' : '0.7rem',
                textAlign: isMobile ? 'left' : 'center',
                lineHeight: 1.2,
                fontWeight: selectedMenu === item.label ? 500 : 400,
              }}
            >
              {item.name}
            </Typography>
          </ListItem>
        ))}

        <Divider sx={{ 
          my: 2, 
          backgroundColor: mode === 'dark' 
            ? theme.palette.divider 
            : 'rgba(255,255,255,0.1)' 
        }} />

        {/* Logout Button */}
        <ListItem
          button
          sx={{
            flexDirection: isMobile ? 'row' : 'column',
            justifyContent: isMobile ? 'flex-start' : 'center',
            alignItems: 'center',
            py: isMobile ? 1.5 : 2,
            px: isMobile ? 2 : 1,
            borderRadius: 1,
            mx: isMobile ? 1 : 1,
            gap: isMobile ? 2 : 0,
            '&:hover': {
              backgroundColor: mode === 'dark' 
                ? theme.palette.error.dark 
                : theme.palette.error.light,
            },
          }}
          onClick={() => setIsModalOpen(true)}
        >
          <ListItemIcon
            sx={{
              justifyContent: 'center',
              color: theme.palette.error.main,
              minWidth: 'auto',
              mb: isMobile ? 0 : 1,
              mr: isMobile ? 2 : 0,
            }}
          >
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography
            variant={isMobile ? "body2" : "caption"}
            sx={{
              color: theme.palette.error.main,
              fontSize: isMobile ? '0.875rem' : '0.7rem',
              textAlign: isMobile ? 'left' : 'center',
            }}
          >
            Logout
          </Typography>
        </ListItem>
      </List>
    </Box>
  )

  

  return (
    <ThemeProvider theme={theme}>
      <LoaderBackdrop openloader={openloader} />
      
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          minHeight: isSmallScreen ? '64px' : '10vh',
          height: isSmallScreen ? 'auto' : '10vh',
          backgroundColor: mode === 'dark' 
            ? theme.palette.background.paper 
            : theme.palette.primary.main,
          color: mode === 'dark' 
            ? theme.palette.text.primary 
            : theme.palette.primary.contrastText,
        }}
      >
        <Toolbar sx={{ minHeight: isSmallScreen ? '64px !important' : 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: isSmallScreen ? 1 : 2,
            }}
          >
            {/* Left side - Menu button (mobile) and controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isSmallScreen ? 1 : 2 }}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <Tooltip title="Menu">
                  <IconButton
                    onClick={() => setMobileDrawerOpen(true)}
                    color="inherit"
                  >
                    <MenuIcon />
                  </IconButton>
                </Tooltip>
              )}

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

              {!isSmallScreen && (
                <>
                  <Tooltip title="Refresh">
                    <IconButton
                      onClick={() => window.location.reload()}
                      color="inherit"
                      sx={{
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'rotate(180deg)' },
                      }}
                    >
                      <RefreshIcon />
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
                </>
              )}
            </Box>

            {/* Center - Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={Logo} 
                  alt="Logo" 
                  height={isSmallScreen ? 40 : 60} 
                  width={isSmallScreen ? 40 : 60} 
                  style={{ objectFit: 'contain' }}
                />
              </Link>
            </Box>

            {/* Right side - Profile */}
            <ProfileMenu />
          </Box>
        </Toolbar>

        {/* Bottom Action Bar for Mobile */}
        {isSmallScreen && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: mode === 'dark' 
                ? theme.palette.background.paper 
                : theme.palette.primary.dark,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Tooltip title="Refresh">
              <IconButton
                onClick={() => window.location.reload()}
                color="inherit"
                size="small"
              >
                <SyncAltRounded fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Go Back">
              <IconButton
                onClick={() => window.history.back()}
                color="inherit"
                size="small"
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </AppBar>

      {/* Main Container */}
      <DashboardContainer>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: '10vh',
              left: 0,
              width: 80,
              height: 'calc(100vh - 10vh)',
              //@ts-ignore
              zIndex: theme.zIndex.drawer,
            }}
          >
            <SidebarContent />
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: 240,
              backgroundColor: mode === 'dark' 
                ? theme.palette.background.paper 
                : theme.palette.primary.dark,
              top: 'auto',
              height: '100%',
            },
          }}
        >
          <Box sx={{ pt: 2 }}>
            <SidebarContent />
          </Box>
        </Drawer>

        {/* Main Content */}
        <MainContent>
          <Outlet />
        </MainContent>

    <Dialog
  open={openMasterModal}
  onClose={() => setOpenMasterModal(false)}
  maxWidth="lg"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 3,
      padding: 2,
      minHeight: "350px",
    },
  }}
>
  <DialogContent>

    <Grid container>

      {/* 🔹 COLUMN 1 */}
      

      <Grid item xs={12} md={4}>
        <Box sx={{ borderRight: "1px solid #ddd", pr: 2 }}>

          {[
            { label: "Add SIM", path: "/sims", icon: <DeveloperBoardIcon /> },
            { label: "Device-SIM Mapping", path: "/device-sim-mapping", icon: <SyncAltRounded /> },
            { label: "Add Device", path: "/devices", icon: <MemoryIcon /> },
            // { label: "Add Base", path: "/bases", icon: <HomeIcon /> },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              onClick={() => {
                setOpenMasterModal(false);
                navigate(item.path);
              }}
            >
              {item.icon}
              <Typography>{item.label}</Typography>
            </Box>
          ))}

        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Box sx={{ borderRight: "1px solid #ddd", pr: 2 }}>

          {[
            { label: "Add SIM", path: "/sims", icon: <DeveloperBoardIcon /> },
            { label: "Add Device", path: "/devices", icon: <MemoryIcon /> },
            { label: "Add Base", path: "/bases", icon: <HomeIcon /> },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              onClick={() => {
                setOpenMasterModal(false);
                navigate(item.path);
              }}
            >
              {item.icon}
              <Typography>{item.label}</Typography>
            </Box>
          ))}

        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Box sx={{ borderRight: "1px solid #ddd", pr: 2 }}>

          {[
            { label: "Add SIM", path: "/sims", icon: <DeveloperBoardIcon /> },
            { label: "Add Device", path: "/devices", icon: <MemoryIcon /> },
            { label: "Add Base", path: "/bases", icon: <HomeIcon /> },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              onClick={() => {
                setOpenMasterModal(false);
                navigate(item.path);
              }}
            >
              {item.icon}
              <Typography>{item.label}</Typography>
            </Box>
          ))}

        </Box>
      </Grid>

 
      {/* <Grid item xs={12} md={4}>
        <Box sx={{ borderRight: "1px solid #ddd", px: 2 }}>

          {[
            "Vehicle Master",
            "Driver Master",
            "Tracking Config",
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                padding: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Typography>{item}</Typography>
            </Box>
          ))}

        </Box>
      </Grid>

   
      <Grid item xs={12} md={4}>
        <Box sx={{ pl: 2 }}>

          {[
            "User Roles",
            "Permissions",
            "Settings",
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                padding: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Typography>{item}</Typography>
            </Box>
          ))}

        </Box>
      </Grid> */}

    </Grid>

  </DialogContent>
</Dialog>

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
