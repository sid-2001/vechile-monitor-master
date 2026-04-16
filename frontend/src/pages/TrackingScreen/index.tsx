import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Paper,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Button,
  LinearProgress,
  Dialog,
  DialogContent,
  IconButton as MuiIconButton,
  AppBar,
  Toolbar
} from '@mui/material'
import {
  MapContainer,
  Marker,
  Circle,
  Popup,
  TileLayer,
  Tooltip as LeafletTooltip,
  useMap
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled'
import SpeedIcon from '@mui/icons-material/Speed'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StopIcon from '@mui/icons-material/Stop'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import CloseIcon from '@mui/icons-material/Close'
import { socket } from "../../services/socket";

type GeofenceArea = {
  _id: string
  name: string
  center: { latitude: number; longitude: number }
  radius: number
}

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom moving vehicle icon (green)
const movingIcon = new L.Icon({
  // iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [35, 35],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom stopped vehicle icon (red)
const stoppedIcon = new L.Icon({
  // iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  //  iconSize: [18, 18],
  // iconAnchor: [9, 9],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to auto-fit map bounds
// const MapBounds: React.FC<{ markers: any[] }> = ({ markers }) => {
//   const map = useMap()
//   useEffect(() => {
//     if (markers.length > 0) {
//       const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
//       map.fitBounds(bounds, { padding: [50, 50] })
//     } else {
//       map.setView([20.5937, 78.9629], 5)
//     }
//   }, [markers, map])
//   return null
// }
const MapBounds: React.FC<{ markers: any[] }> = ({ markers }) => {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (!hasFitted.current && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
      hasFitted.current = true
    }
  }, [markers, map])

  return null
}

// Map Component to be reused
const geofenceStyle = {
  color: '#FFDE42',
  weight: 3,
  dashArray: '8 8',
  fillColor: '#FFDE42',
  fillOpacity: 0.08
}

const LiveMap: React.FC<{ markers: any[]; geofences: GeofenceArea[]; loading?: boolean }> = ({ markers, geofences, loading }) => {
  const theme = useTheme()
  
  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {loading && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }} />
      )}
      <MapContainer
  center={[22.9734, 78.6569]}
  zoom={5}
  // minZoom={4}
  minZoom={5}
  maxZoom={18}
  maxBounds={[
    [6, 67],
  [38, 98]
  ]}
  maxBoundsViscosity={1.0}
  style={{ height: '100%', width: '100%' }}
  zoomControl={true}
>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(v => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={v.status === 'moving' ? movingIcon : stoppedIcon}
          >
            <Popup>
              <Box sx={{ minWidth: 200, p: 0.5 , color: 'black'}}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsCarIcon fontSize="small" color="primary" />
                  {v.vehicleNumber}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon fontSize="small" color={v.status === 'moving' ? 'success' : 'disabled'} />
                    <Typography variant="body2">
                      Speed: <strong>{v.speed} km/h</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiberManualRecordIcon fontSize="small" sx={{ color: v.status === 'moving' ? 'success.main' : 'error.main' }} />
                    <Typography variant="body2">
                      Status: <strong style={{ color: v.status === 'moving' ? '#2e7d32' : '#d32f2f' }}>{v.status.toUpperCase()}</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="primary" />
                      
                      <Typography variant="body2">
                        Lat: <strong>{v.lat?.toFixed(6)}</strong>
                      </Typography>

                      <Typography variant="body2">
                        |
                      </Typography>

                      <Typography variant="body2">
                        Lng: <strong>{v.lng?.toFixed(6)}</strong>
                      </Typography>
                    </Box>

                  
                  {v.lastUpdated && (
                    <Typography variant="caption" color="text.secondary">
                      {/* Updated: {new Date(v.lastUpdated).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata"
                     })} */}
                     Updated: {new Date(v.lastUpdated).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour12: true,
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                    </Typography>
                  )}
                  <Typography variant="body2">
  Direction: <strong>{v.angle ?? 0}°</strong>
</Typography>
                </Stack>
              </Box>
            </Popup>
            <LeafletTooltip 
              direction="top"
              offset={[0, -20]}
              opacity={0.9}
              permanent={false}
            >
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: '12px' }}>
                {v.vehicleNumber} | {v.speed} km/h
              </Box>
            </LeafletTooltip>
          </Marker>
        ))}
        {geofences.map((fence) =>
          fence.center && fence.radius ? (
            <Circle
              key={fence._id}
              center={[fence.center.latitude, fence.center.longitude]}
              radius={fence.radius}
              pathOptions={geofenceStyle}
            />
          ) : null
        )}
        <MapBounds markers={markers} />
      </MapContainer>
    </Box>
  )
}


const smoothMove = (start: any, end: any, duration = 1000, onUpdate: any) => {
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);
    const progress = t * (2 - t); 

    const lat = start.lat + (end.lat - start.lat) * progress;
    const lng = start.lng + (end.lng - start.lng) * progress;

    onUpdate(lat, lng);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};
const TrackingScreen = () => {
  const vehicleMapRef = useRef(new Map());
  const theme = useTheme()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchingHistory, setSearchingHistory] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [geofences, setGeofences] = useState<GeofenceArea[]>([])

  const buildVehiclesWithLatestLocations = (vehicleItems: any[], locationItems: any[]) => {
    const latestByVehicle = new Map<string, any>()
    ;(locationItems || []).forEach((loc: any) => {
      if (!latestByVehicle.has(String(loc.vehicleId))) latestByVehicle.set(String(loc.vehicleId), loc)
    })

    return (vehicleItems || []).map((v: any) => {
      const loc = latestByVehicle.get(v._id)
      return {
        id: v._id,
        vehicleNumber: v.vehicleNumber,
        deviceId: v.deviceId,
        status: loc?.ignition ? 'moving' : 'stopped',
        speed: loc?.speed || 0,
        lat: loc?.latitude,
        lng: loc?.longitude,
        lastUpdated: loc?.time,
        address: loc?.address || 'Location unavailable'
      }
    })
  }

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const [vehicleRes, locationRes] = await Promise.all([
        vehicleMonitorService.getVehicles(),
        vehicleMonitorService.getVehicleLocations({ limit: 1000, sortBy: 'time', sortOrder: 'desc' })
      ])

      setVehicles(buildVehiclesWithLatestLocations(vehicleRes.items || [], locationRes.items || []))
      setError('')
      setLastRefresh(new Date())
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load tracking data')
    } finally {
      setLoading(false)
    }
  }

  const loadGeofences = async () => {
    try {
      const data = await vehicleMonitorService.getGeofences()
      setGeofences(data.items || [])
    } catch (e) {
      console.error('Unable to load geofences', e)
    }
  }

  useEffect(() => {
    loadGeofences()
    const refreshGeofences = () => loadGeofences()
    window.addEventListener('focus', refreshGeofences)
    return () => window.removeEventListener('focus', refreshGeofences)
  }, [])

  // useEffect(() => {
  //   loadVehicles()
  // }, [])



  useEffect(() => {
  console.log(" Listening for vehicleLocationBulkUpdate");

  socket.on("vehicleLocationBulkUpdate", (data) => {
    console.log(" SOCKET RAW DATA:", data);

    // const updatedVehicles = data.map((loc: any) => ({
      
    //   id: String(loc.vehicleId),
    //   // vehicleNumber: String(loc.vehicleId),
    //   // vehicleNumber: loc.vehicleNumber || String(loc.vehicleId),
    //   vehicleNumber: vehicleMapRef.current.get(String(loc.vehicleId)) || "Unknown",
    //   status: loc.ignition ? 'moving' : 'stopped',
    //   ignition: loc.ignition,
    //   speed: loc.speed,
    //   lat: loc.latitude,
    //   lng: loc.longitude,
    //   lastUpdated: loc.time
    // }));

    const updatedVehicles = data.map((loc: any) => {

  // 🔥 STEP A: map update karo agar vehicleNumber mila
  if (loc.vehicleNumber) {
    vehicleMapRef.current.set(String(loc.vehicleId), loc.vehicleNumber);
  }

  return {
    id: String(loc.vehicleId),
    vehicleNumber: vehicleMapRef.current.get(String(loc.vehicleId)) || String(loc.vehicleId),
    status: loc.ignition ? 'moving' : 'stopped',
    ignition: loc.ignition,
    speed: loc.speed,
    lat: loc.latitude,
    lng: loc.longitude,
    angle: loc.angle,
    lastUpdated: loc.time
  };
});
    console.log("UPDATED VEHICLES:", updatedVehicles);

    // 🔥 IMPORTANT: smooth update instead of replace
    // setVehicles((prev) => {
    //   const map = new Map(prev.map(v => [v.id, v]));

    //   updatedVehicles.forEach((v) => {
    //     const old = map.get(v.id);

    //     if (old) {
    //       map.set(v.id, {
    //         ...old,
    //         ...v,
    //         lat: old.lat + (v.lat - old.lat) * 0.2,
    //         lng: old.lng + (v.lng - old.lng) * 0.2
    //       });
    //     } else {
    //       map.set(v.id, v);
    //     }
    //   });

    //   return Array.from(map.values());
    // });

    setVehicles((prev) => {
  const map = new Map(prev.map(v => [v.id, v]));

  updatedVehicles.forEach((v: any) => {
    const old = map.get(v.id);

    if (old && old.lat && old.lng) {
      smoothMove(
        { lat: old.lat, lng: old.lng },
        { lat: v.lat, lng: v.lng },
        1000,
        (lat: number, lng: number) => {
          setVehicles((current) =>
            current.map((item) =>
              item.id === v.id ? { ...item, ...v, lat, lng } : item
            )
          );
        }
      );
    } else {
      map.set(v.id, v);
    }
  });

  return Array.from(map.values());
});

    setLastRefresh(new Date());
  });

  return () => {
    socket.off("vehicleLocationBulkUpdate");
  };
}, []);



  // useEffect(() => {
  //   const refreshLatestLocations = async () => {
  //     try {
  //       const [vehicleRes, locationRes] = await Promise.all([
  //         vehicleMonitorService.getVehicles(),
  //         vehicleMonitorService.getVehicleLocations({ limit: 1000, sortBy: 'time', sortOrder: 'desc' })
  //       ])

  //       setVehicles(buildVehiclesWithLatestLocations(vehicleRes.items || [], locationRes.items || []))
  //       setLastRefresh(new Date())
  //     } catch (e) {
  //       console.error('Unable to refresh latest vehicle locations', e)
  //     }
  //   }

  //   const intervalId = setInterval(() => {
  //     refreshLatestLocations()
  //   }, 2000)

  //   return () => clearInterval(intervalId)
  // }, [])

  const markers = useMemo(() => vehicles.filter((v) => v.lat && v.lng), [vehicles])

  const searchHistory = async () => {
    if (!selectedVehicle || !fromDate || !toDate) return
    setSearchingHistory(true)
    try {
      const res = await vehicleMonitorService.getVehicleLocations({
        vehicleId: selectedVehicle,
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
        limit: 500,
        sortBy: 'time',
        sortOrder: 'asc'
      })
      setHistory(res.items || [])
    } catch (e: any) {
      setError(e?.error_message || 'Failed to load history')
    } finally {
      setSearchingHistory(false)
    }
  }
const movingVehicles = vehicles.filter(v => v.ignition === true)
  // const movingVehicles = vehicles.filter(v => v.status === 'moving' && v.speed > 0)
  const stoppedVehicles = vehicles.filter(v => v.ignition === false)

  return (
    <Box sx={{ maxWidth: 1800, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
            <DirectionsCarFilledIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Live Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time vehicle monitoring • Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={loadVehicles} disabled={loading} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">MOVING VEHICLES</Typography>
                  <Typography variant="h3" fontWeight="bold" color="success.main">{movingVehicles.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), borderLeft: `4px solid ${theme.palette.error.main}` }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">STOPPED VEHICLES</Typography>
                  <Typography variant="h3" fontWeight="bold" color="error.main">{stoppedVehicles.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
                  <StopIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">TOTAL VEHICLES</Typography>
                  <Typography variant="h3" fontWeight="bold" color="info.main">{vehicles.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                  <DirectionsCarIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* History Search Card */}
      {/* <Card sx={{ mb: 3, borderRadius: 3, boxShadow: theme.shadows[2] }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">Vehicle History Search</Typography>
          </Stack>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
             <Select
  fullWidth
  value={selectedVehicle}
  onChange={(e) => setSelectedVehicle(e.target.value)}
  displayEmpty
  sx={{
    borderRadius: 2,
    backgroundColor: '#fff',
    
    // FIX TEXT COLOR
    color: '#000',

    // FIX INPUT TEXT
    '& .MuiSelect-select': {
      color: '#000',
    },

    // FIX BORDER
    '.MuiOutlinedInput-notchedOutline': {
      borderColor: '#ccc',
    },

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1976d2',
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1976d2',
    },

    // FIX ICON (arrow)
    '.MuiSvgIcon-root': {
      color: '#000',
    }
  }}
>
                <MenuItem value="">Select Vehicle</MenuItem>
                {vehicles.map(v => (
                  <MenuItem key={v.id} value={v.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FiberManualRecordIcon sx={{ fontSize: 12, color: v.status === 'moving' ? 'success.main' : 'error.main' }} />
                      <span>{v.vehicleNumber}</span>
                      {v.speed > 0 && <Chip
  label={`${v.speed} km/h`}
  size="small"
  variant="outlined"
  sx={{
    color: '#000', 
    borderColor: '#000', 
    '& .MuiChip-label': {
      color: '#000',
    }
  }}
/>}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                placeholder="From Date"
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                placeholder="To Date"
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={searchHistory}
                disabled={!selectedVehicle || !fromDate || !toDate || searchingHistory}
                startIcon={<HistoryIcon />}
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                {searchingHistory ? 'Loading...' : 'Load History'}
              </Button>
            </Grid>
          </Grid>
          {history.length > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
              <Typography variant="body2">
                📍 Found <strong>{history.length}</strong> history points for the selected period
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card> */}

      {/* Map and Vehicles Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[3] }}>
            {/* Map Header with Fullscreen Button */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              p: 1, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Tooltip title="View Fullscreen">
                <IconButton 
                  onClick={() => setFullscreenOpen(true)}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <FullscreenIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ height: { xs: 400, sm: 500, md: 600 }, position: 'relative' }}>
                  <LiveMap markers={markers} geofences={geofences} loading={loading} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Live Vehicles List */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2], mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Live Vehicles</Typography>
                <Chip
                  label={`${vehicles.length} total`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {vehicles.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No vehicles available
                </Typography>
              ) : (
                <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                  {vehicles.map(v => (
                    <Zoom in key={v.id} style={{ transitionDelay: '50ms' }}>
                      <ListItem
                        sx={{
                          mb: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.6),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: v.status === 'moving' ? '#4caf50' : '#f44336',
                                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                              }
                            }}
                          >
                            <Avatar sx={{ bgcolor: v.status === 'moving' ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.2) }}>
                              <DirectionsCarIcon sx={{ color: v.status === 'moving' ? '#2e7d32' : '#d32f2f' }} />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight="bold">
                              {v.vehicleNumber}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                              <Chip
                                label={v.status}
                                size="small"
                                sx={{
                                  bgcolor: v.status === 'moving' ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
                                  color: v.status === 'moving' ? '#2e7d32' : '#d32f2f',
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SpeedIcon sx={{ fontSize: 12 }} />
                                {v.speed} km/h
                              </Typography>
                            </Stack>
                          }
                        />
                        {v.status === 'moving' && v.speed > 0 && (
                          <Chip
                            label={`${v.speed} km/h`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                      </ListItem>
                    </Zoom>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* History Points Summary */}
          {/* <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                History Points
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {history.length > 0 ? (
                <Fade in>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), color: 'info.main' }}>
                        <HistoryIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">{history.length}</Typography>
                        <Typography variant="caption" color="text.secondary">location points found</Typography>
                      </Box>
                    </Stack>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('History points:', history)
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LocationOnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    {selectedVehicle ? 'No history points found' : 'Select a vehicle and date range'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card> */}
        </Grid>
      </Grid>

      {/* Fullscreen Map Dialog */}
      <Dialog
        fullScreen
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
            position: 'relative'
          }
        }}
      >
        <AppBar sx={{ position: 'relative', bgcolor: theme.palette.primary.main }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Live Tracking - Fullscreen Map
            </Typography>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setFullscreenOpen(false)}
              aria-label="close"
            >
              <FullscreenExitIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => setFullscreenOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ p: 0, height: 'calc(100% - 64px)' }}>
          <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
            {/* Vehicle stats overlay in fullscreen */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                bgcolor: 'rgba(0,0,0,0.75)',
                borderRadius: 2,
                p: 1.5,
                color: 'white',
                minWidth: 180,
                backdropFilter: 'blur(8px)'
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>LIVE STATS</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#4caf50' }}>Moving: {movingVehicles.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#f44336' }}>Stopped: {stoppedVehicles.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Total: {vehicles.length}</Typography>
                </Box>
              </Stack>
            </Box>
                          <LiveMap markers={markers} geofences={geofences} loading={loading} />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default TrackingScreen
