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
      main: '#4C5C2D',   // olive green
      light: '#6f7f45',
      dark: '#313E17',
    },
    secondary: {
      main: '#FFDE42',   // tactical yellow
      light: '#ffe873',
      dark: '#c7a800',
    },
    background: {
      default: '#0000',
      paper: mode === 'dark' ? '#1B0C0C' : '#f5f5f5',
    },
    text: {
      primary: '#ffffff',
      secondary: '#d1d5db',
    },
  },

  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    allVariants: {
      color: '#ffffff',
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'linear-gradient(135deg, #313E17 0%, #1B0C0C 100%)',
          color: '#ffffff',
          minHeight: '100vh',
        },

        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(27, 12, 12, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',

          '& .super-app-theme--header': {
            backgroundColor: '#4C5C2D',
            color: '#fff',
          },

          '& .MuiDataGrid-row:nth-of-type(even)': {
            backgroundColor: 'rgba(255,222,66,0.05)',
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
          backgroundColor: 'rgba(27, 12, 12, 0.9)',
          borderRadius: 10,

          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.3)',
          },

          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FFDE42',
          },

          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FFDE42',
          },
        },
        input: {
          color: '#ffffff',
        },
      },
    },

    // ✅ FORCE ALL LABELS WHITE (normal + focus + shrink)
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
        shrink: {
          color: '#ffffff',
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&.Mui-focused': {
            color: '#ffffff',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(135deg, rgba(76,92,45,0.25), rgba(27,12,12,0.6))',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          color: '#fff',
          border: '1px solid rgba(255,222,66,0.15)',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            background:
              'linear-gradient(135deg, rgba(49,62,23,0.8), rgba(27,12,12,0.9))',
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
