import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSetRecoilState } from "recoil";
import { alertState, alertTextState, alertTypeState } from "./states/state";
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
import GeofenceManagement from './pages/GeofenceManagement'
import LocationHistory from './pages/LocationHistory'
import LocationSimulator from './pages/LocationSimulator'
import AnalyticsScreen from './pages/Analytics'
import { socket } from "./services/socket";
import { useEffect } from 'react'
import { toast } from "react-toastify";


function App() {
  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, 'outlet'> = {
    authenticationPath: '/login',
  }
  const [mode, setMode] = useRecoilState(themeModeState)
  const [inactivity, setinactivityTiming] = useRecoilState(inactivityTiming)
  const [warningOpen, setWarningOpen] = useState(false)
  const local_service: any = new LocalStorageService()
 const setAlertOpen = useSetRecoilState(alertState);
const setAlertText = useSetRecoilState(alertTextState);
const setAlertType = useSetRecoilState(alertTypeState);

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
          mode === 'dark'
            ? 'linear-gradient(135deg, rgba(49,62,23,0.8), rgba(27,12,12,0.9))'
            : 'linear-gradient(135deg,  rgba(49,62,23,0.8), rgba(88, 49, 49, 0.8))',
        backdropFilter: 'blur(6px)',
      },
    },

    paper: {
      background:
        mode === 'dark'
          ? 'linear-gradient(135deg, rgba(76,92,45,0.3), rgba(27,12,12,0.8))'
          : 'linear-gradient(135deg,  rgba(76,92,45,0.3), rgba(245,245,245,0.95))',

      color: mode === 'dark' ? '#ffffff' : '#1a1a1a',

      border: mode === 'dark'
        ? '1px solid rgba(255,222,66,0.2)'
        : '1px solid rgba(0,0,0,0.1)',

      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
    },
  },
},



MuiSelect: {
  styleOverrides: {
    icon: {
      color: '#ffffff', // white dropdown arrow
    },
  },
},

MuiMenu: {
  styleOverrides: {
    paper: {
      backgroundColor:
        mode === 'dark' ? '#1e1e1e' : '#ffffff',
      backdropFilter: 'blur(10px)',
      borderRadius: '10px',
    },
  },
},

MuiMenuItem: {
  styleOverrides: {
    root: {
      color: mode === 'dark' ? '#ffffff' : '#000000',

      '&:hover': {
        backgroundColor:
          mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.04)',
      },

      '&.Mui-selected': {
        backgroundColor:
          mode === 'dark'
            ? 'rgba(255, 222, 66, 0.15)'
            : 'rgba(0, 0, 0, 0.08)',
      },

      '&.Mui-selected:hover': {
        backgroundColor:
          mode === 'dark'
            ? 'rgba(255, 222, 66, 0.25)'
            : 'rgba(0, 0, 0, 0.12)',
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
//   const INACTIVITY_TIME = 1 * 60 * 1000 // 1 minutes
//   // ✅ Enable auto logout (30 min inactivity)
//   // useAutoLogout(handleLogout, Number(inactivity) * 60000 > INACTIVITY_TIME ? Number(inactivity) * 60000 : INACTIVITY_TIME)
// useAutoLogout(handleInactivity, Number(inactivity) * 60000 > INACTIVITY_TIME
//   ? Number(inactivity) * 60000
//   : INACTIVITY_TIME)

useEffect(() => {
  console.log("🟡 Initializing socket...");

  socket.connect();

  socket.on("connect", () => {
  console.log("✅ SOCKET CONNECTED:", socket.id);
});

// 👇 OUTSIDE CONNECT
// socket.on("vehicle:sos:created", (data) => {
//   console.log("🚨 RECEIVED SOS CREATED", data);
  

//   const token = localStorage.getItem("access_token");

//   toast.error(`🚨 SOS ALERT - ${data.vehicleNumber}`, {
//     autoClose: false, // 
//     closeOnClick: false,
//     draggable: false,

//    onClose: async () => {
//   try {
//     const token = JSON.parse(localStorage.getItem("access_token") || "");

//     const res = await fetch(
//       `http://localhost:5000/api/sos/close/${data.sosId}`,
//       {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (!res.ok) {
//       throw new Error("API failed");
//     }

//     console.log("✅ SOS closed SUCCESSFULLY");
//   } catch (err) {
//     console.error("❌ Close API FAILED", err);
//   }
// },
//   });
// });
socket.on("vehicle:sos:created", (data) => {
  console.log("🚨 RECEIVED SOS CREATED", data);

  // 🔥 DEBUG (IMPORTANT)
  console.log("👉 vehicleNumber:", data.vehicleNumber);
  console.log("👉 FULL DATA:", data);

  // ✅ SAFE VALUE
  const vehicleName =
    data.vehicleNumber ||   // correct case
    data.vehicle_number || // fallback case
    data.name ||           // fallback
    data.vehicleId;        // last fallback

  toast.error(`🚨 SOS ALERT - ${vehicleName}`, {
    autoClose: false,
    closeOnClick: false,
    draggable: false,

    onClose: async () => {
      try {
        const token = JSON.parse(localStorage.getItem("access_token") || "");

        const res = await fetch(
          `http://localhost:5000/api/sos/close/${data.sosId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("API failed");

        console.log("✅ SOS closed SUCCESSFULLY");
      } catch (err) {
        console.error("❌ Close API FAILED", err);
      }
    },
  });
});

socket.on("vehicle:sos:closed", (data) => {
  console.log("✅ RECEIVED SOS CLOSED", data);

  setAlertText(`SOS Closed - ${data.vehicleNumber} by ${data.closedBy}`);
  setAlertType("success");
  setAlertOpen(true);
  console.log(alertState)
});

socket.on("vehicle:geofence:alert", (data) => {
  const action = data.eventType === 'enter' ? 'entered' : 'exited'
  toast.info(`📍 ${data.vehicleNumber} ${action} ${data.geofenceName}`)
})

socket.on("vehicle:speed:alert", (data) => {
  toast.warn(`⚠️ Overspeed: ${data.vehicleNumber} at ${data.speed} km/h (limit ${data.maxSpeed})`)
})

socket.on("vehicle:braking:alert", (data) => {
  toast.warn(`🛑 Harsh braking: ${data.vehicleNumber} (${data.previousSpeed} → ${data.speed} km/h)`)
})

  return () => {
    socket.off("connect");
    socket.off("vehicle:sos:created");
    socket.off("vehicle:sos:closed");
    socket.off("vehicle:geofence:alert");
    socket.off("vehicle:speed:alert");
    socket.off("vehicle:braking:alert");
  };
}, []);
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* <LoaderBackdrop /> */}
        {/* <Message /> */}
        <ToastContainer
  position="top-center"
  autoClose={false} // 
  closeOnClick={false}
  draggable={false}
/>
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
               <Route path="geofence" element={<GeofenceManagement />} />
               <Route path="location-history" element={<LocationHistory />} />
               <Route path="location-simulator" element={<LocationSimulator />} />
               <Route path="analytics" element={<AnalyticsScreen />} />
            
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
