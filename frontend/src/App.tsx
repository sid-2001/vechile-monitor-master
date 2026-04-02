import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from '@emotion/react'
import { createTheme } from '@mui/material/styles'
import type { ProtectedRouteProps } from './helpers/protected-route'
import { LocalStorageService } from './helpers/local-storage-service'
import ProtectedRoute from './helpers/protected-route'
import { useRecoilState } from 'recoil'
import { inactivityTiming, themeModeState } from './states/state'
import { useCallback, useState } from 'react'
import { useAutoLogout } from './helpers/useAutoLogout'
import { CssBaseline } from '@mui/material'
import CustomSnackbar from './components/customsnackbar/snackbar'
import InactivityWarningModal from './components/inactivity-modal'
import Login from './pages/login'
import DashboardLayout from './components/shared-layout'
import TrackingScreen from './pages/TrackingScreen'
import UserManagement from './pages/UserManagement'
import BaseManagement from './pages/BaseManagement'
import VehicleManagement from './pages/VehicleManagement'
import UserManagementApi from './pages/UserManagementApi'
import DeviceManagement from './pages/DeviceManagement'
function App() {
  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, 'outlet'> = {
    authenticationPath: '/login',
  }
  const [mode, setMode] = useRecoilState(themeModeState)
  const [inactivity, setinactivityTiming] = useRecoilState(inactivityTiming)
  const [warningOpen, setWarningOpen] = useState(false)
  const local_service: any = new LocalStorageService()

const theme = createTheme({
  palette: {
    mode,
    primary: {
      main: '#667eea',   // gradient start
      light: '#8fa4f3',
      dark: '#4c63d2',
    },
    secondary: {
      main: '#764ba2',   // gradient end
      light: '#9a7bc3',
      dark: '#5a3785',
    },
    background: {
      default: '#0000', // important for gradient
      paper: mode === 'dark' ? '#1e1e2f' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#1a1a1a',
      secondary: mode === 'dark' ? '#B0BEC5' : '#455A64',
    },
  },

  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    h1: { color: 'text.primary' },
    h2: { color: 'text.primary' },
    h3: { color: 'text.primary' },
    h4: { color: 'text.primary' },
    h5: { color: 'text.primary' },
    h6: { color: 'text.primary' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: mode === 'dark' ? '#fff' : '#000',
          transition: 'all 0.3s ease',
          minHeight: '100vh',
        },

        /* Hide scrollbar */
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',

        '#root': {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        },
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark'
            ? 'rgba(10, 28, 44, 0.7)'
            : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',

          '& .super-app-theme--header': {
            backgroundColor: '#5a67d8',
            color: '#fff',
          },

          '& .MuiDataGrid-row:nth-of-type(even)': {
            backgroundColor: mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(102,126,234,0.1)',
          },
        },
      },
    },


    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.35)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#93c5fd' : '#3b82f6',
          },
        },
        input: {
          color: mode === 'dark' ? '#e2e8f0' : '#0f172a',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#cbd5e1' : '#334155',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: '#fff',
          transition: 'all 0.3s ease',
        },
      },
    },

    MuiDialog: {
      defaultProps: {
        disableEscapeKeyDown: true,
      },
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            background:
              'linear-gradient(135deg, rgba(102,126,234,0.6), rgba(118,75,162,0.6))',
            backdropFilter: 'blur(6px)',
          },
        },
      },
    },
  },
});
const handleInactivity = () => {
  if(local_service.get_accesstoken()!=null){
 setWarningOpen(true)

  }
 
}
  const handleLogout = useCallback(() => {
    if (local_service?.get_accesstoken() != null) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }, [])
  const INACTIVITY_TIME = 1 * 60 * 1000 // 1 minutes
  // ✅ Enable auto logout (30 min inactivity)
  // useAutoLogout(handleLogout, Number(inactivity) * 60000 > INACTIVITY_TIME ? Number(inactivity) * 60000 : INACTIVITY_TIME)
useAutoLogout(handleInactivity, Number(inactivity) * 60000 > INACTIVITY_TIME
  ? Number(inactivity) * 60000
  : INACTIVITY_TIME)

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* <LoaderBackdrop /> */}
        {/* <Message /> */}
        <ToastContainer />
        <CustomSnackbar />
        <InactivityWarningModal
  open={warningOpen}
  onStay={() => setWarningOpen(false)}
  onLogout={handleLogout}
/>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<DashboardLayout />} />}>
              <Route index element={<TrackingScreen />}></Route>
             <Route path="tracking" element={<TrackingScreen />} />
               <Route path="user" element={<UserManagementApi />} />
               <Route path="bases" element={<BaseManagement />} />
               <Route path="vehicles" element={<VehicleManagement />} />
               <Route path="devices" element={<DeviceManagement />} />
            
            </Route>

            <Route path="login" element={<Login />} />
            {/* <Route path="transaction/response" element={<GifModal />} />
            <Route path="reset-password" element={<ResetPasswordPage />} /> */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  )
}

export default App

function handleLogout(): void {
  throw new Error('Function not implemented.')
}
