import { useEffect, useState, useRef } from "react";
import { 
  Box, Select, MenuItem, TextField, Button, Stack, Typography, 
  Chip, IconButton, Paper, Grid, Divider, Card, CardContent, 
  Avatar, Alert, Snackbar, Drawer, Fab, useMediaQuery, useTheme, Zoom, Fade
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Vehicle type symbols
const vehicleSymbols = {
  truck: '🚚',
  car: '🚗',
  bike: '🏍️',
  bus: '🚌',
  van: '🚐',
};

// Status configuration (only moving and stopped)
const statusConfig = {
  moving: { symbol: '▶️', color: '#10b981', label: 'MOVING', bg: '#10b98120', glow: '0 0 10px rgba(16,185,129,0.5)' },
  stopped: { symbol: '⏹️', color: '#ef4444', label: 'STOPPED', bg: '#ef444420', glow: 'none' },
};

// Generate historical data
const generateHistoricalData = (baseLat: number, baseLng: number, startDate: Date, endDate: Date) => {
  const history = [];
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const pointsCount = Math.min(Math.floor(hoursDiff), 50);
  
  for (let i = 0; i <= pointsCount; i++) {
    const progress = i / pointsCount;
    const timestamp = new Date(startDate.getTime() + (progress * (endDate.getTime() - startDate.getTime())));
    const lat = baseLat + (Math.sin(progress * Math.PI * 2) * 0.05) + (Math.random() - 0.5) * 0.01;
    const lng = baseLng + (Math.cos(progress * Math.PI * 1.5) * 0.05) + (Math.random() - 0.5) * 0.01;
    
    history.push({
      lat,
      lng,
      timestamp,
      speed: Math.random() * 60 + 20,
    });
  }
  return history;
};

// Sample vehicles
const sampleVehicles = [
  {
    id: "1",
    name: "Express Truck",
    type: "truck",
    registrationNumber: "MH12AB1234",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43210",
    lat: 28.6139,
    lng: 77.2090,
    address: "Connaught Place, New Delhi",
    status: "moving",
    speed: 65,
    fuelLevel: 75,
    lastUpdated: new Date(),
    totalDistance: 1250,
    historicalData: generateHistoricalData(28.6139, 77.2090, new Date(2024, 2, 1), new Date(2024, 2, 15)),
  },
  {
    id: "2",
    name: "City Car",
    type: "car",
    registrationNumber: "DL05CD6789",
    driverName: "Sunil Sharma",
    driverPhone: "+91 98765 43211",
    lat: 19.0760,
    lng: 72.8777,
    address: "Mumbai Central, Maharashtra",
    status: "moving",
    speed: 45,
    fuelLevel: 60,
    lastUpdated: new Date(),
    totalDistance: 890,
    historicalData: generateHistoricalData(19.0760, 72.8777, new Date(2024, 2, 1), new Date(2024, 2, 15)),
  },
  {
    id: "3",
    name: "Fast Bike",
    type: "bike",
    registrationNumber: "KA01EF2345",
    driverName: "Arjun Reddy",
    driverPhone: "+91 98765 43212",
    lat: 12.9716,
    lng: 77.5946,
    address: "MG Road, Bangalore",
    status: "stopped",
    speed: 0,
    fuelLevel: 45,
    lastUpdated: new Date(),
    totalDistance: 450,
    historicalData: generateHistoricalData(12.9716, 77.5946, new Date(2024, 2, 1), new Date(2024, 2, 15)),
  },
  {
    id: "4",
    name: "City Bus",
    type: "bus",
    registrationNumber: "TN09IJ1234",
    driverName: "Karthik S",
    driverPhone: "+91 98765 43213",
    lat: 13.0827,
    lng: 80.2707,
    address: "Anna Nagar, Chennai",
    status: "moving",
    speed: 35,
    fuelLevel: 85,
    lastUpdated: new Date(),
    totalDistance: 670,
    historicalData: generateHistoricalData(13.0827, 80.2707, new Date(2024, 2, 1), new Date(2024, 2, 15)),
  },
  {
    id: "5",
    name: "Delivery Van",
    type: "van",
    registrationNumber: "GJ06GH7890",
    driverName: "Mahesh Patel",
    driverPhone: "+91 98765 43214",
    lat: 23.0225,
    lng: 72.5714,
    address: "Ahmedabad, Gujarat",
    status: "stopped",
    speed: 0,
    fuelLevel: 30,
    lastUpdated: new Date(),
    totalDistance: 2100,
    historicalData: generateHistoricalData(23.0225, 72.5714, new Date(2024, 2, 1), new Date(2024, 2, 15)),
  },
];

// Custom marker with emoji
const createVehicleMarker = (vehicle: any, isSelected: boolean = false) => {
  const status = statusConfig[vehicle.status as keyof typeof statusConfig] || statusConfig.moving;
  const size = isSelected ? 52 : 44;
  
  const markerHtml = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${size + 8}px;
        height: ${size + 8}px;
        background: ${status.color};
        border-radius: 50%;
        opacity: 0.2;
        animation: ${vehicle.status === 'moving' ? 'ripple 1.5s infinite' : 'none'};
      "></div>
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size === 52 ? '30px' : '26px'};
        box-shadow: 0 8px 20px rgba(0,0,0,0.2), 0 0 0 3px ${status.color};
        transition: all 0.3s ease;
        transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'};
      ">
        ${vehicleSymbols[vehicle.type as keyof typeof vehicleSymbols] || '🚗'}
      </div>
      ${vehicle.status === 'moving' ? `
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: ${status.color};
          color: white;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          ⚡ ${vehicle.speed} km/h
        </div>
      ` : ''}
    </div>
    <style>
      @keyframes ripple {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
      }
    </style>
  `;
  
  return L.divIcon({
    html: markerHtml,
    className: 'custom-vehicle-marker',
    iconSize: [size, size],
    popupAnchor: [0, -size/2],
  });
};

// Fullscreen component
const FullscreenButton = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <IconButton 
      onClick={toggleFullscreen}
      sx={{ 
        bgcolor: 'white', 
        boxShadow: 3,
        '&:hover': { 
          bgcolor: '#f5f5f5',
          transform: 'scale(1.05)',
        },
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: 20 }}>{isFullscreen ? '📱' : '🖥️'}</span>
    </IconButton>
  );
};

// Fit bounds component
const FitBounds = ({ positions }: { positions: Array<[number, number]> }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

// Map controls component with working zoom
const MapControls = ({ map, onCenter, onToggleHistory, showHistory }: any) => {
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  return (
    <Box sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, display: 'flex', gap: 1.5, flexDirection: 'column' }}>
      <IconButton 
        size="small" 
        sx={{ 
          bgcolor: 'white', 
          boxShadow: 3,
          width: 40,
          height: 40,
          '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(1.05)' },
          transition: 'all 0.2s ease'
        }} 
        onClick={handleZoomIn}
      >
        <span style={{ fontSize: 20 }}>🔍+</span>
      </IconButton>
      <IconButton 
        size="small" 
        sx={{ 
          bgcolor: 'white', 
          boxShadow: 3,
          width: 40,
          height: 40,
          '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(1.05)' },
          transition: 'all 0.2s ease'
        }} 
        onClick={handleZoomOut}
      >
        <span style={{ fontSize: 20 }}>🔍-</span>
      </IconButton>
      <IconButton 
        size="small" 
        sx={{ 
          bgcolor: 'white', 
          boxShadow: 3,
          width: 40,
          height: 40,
          '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(1.05)' },
          transition: 'all 0.2s ease'
        }} 
        onClick={onCenter}
      >
        <span style={{ fontSize: 20 }}>🎯</span>
      </IconButton>
      <IconButton 
        size="small" 
        sx={{ 
          bgcolor: showHistory ? '#10b981' : 'white', 
          boxShadow: 3,
          width: 40,
          height: 40,
          color: showHistory ? 'white' : 'inherit',
          '&:hover': { bgcolor: showHistory ? '#0d9668' : '#f5f5f5', transform: 'scale(1.05)' },
          transition: 'all 0.2s ease'
        }} 
        onClick={onToggleHistory}
      >
        <span style={{ fontSize: 20 }}>{showHistory ? '🗺️' : '📍'}</span>
      </IconButton>
    </Box>
  );
};

// Map component with ref
const MapComponent = ({ center, zoom, children, onMapReady }: any) => {
  const mapRef = useRef<any>(null);

  const handleMapReady = () => {
    if (mapRef.current) {
      onMapReady(mapRef.current);
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      ref={mapRef}
      whenReady={handleMapReady}
    >
      {children}
    </MapContainer>
  );
};

const TrackingScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [vehicles] = useState(sampleVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historicalPoints, setHistoricalPoints] = useState<Array<any>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedVehicleData, setSelectedVehicleData] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    stopped: vehicles.filter(v => v.status === 'stopped').length,
  };

  const handleSearch = () => {
    if (!selectedVehicle) {
      setSnackbar({ open: true, message: '⚠️ Please select a vehicle first', type: 'warning' });
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (vehicle && fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      const filteredHistory = vehicle.historicalData.filter((point: any) => {
        const pointDate = new Date(point.timestamp);
        return pointDate >= from && pointDate <= to;
      });
      
      setHistoricalPoints(filteredHistory);
      setShowHistory(true);
      setSelectedVehicleData(vehicle);
      setMapCenter([vehicle.lat, vehicle.lng]);
      setMapZoom(12);
      if (mapInstance) {
        mapInstance.setView([vehicle.lat, vehicle.lng], 12);
      }
      setSnackbar({ open: true, message: `📍 Found ${filteredHistory.length} historical points`, type: 'success' });
    } else {
      setSnackbar({ open: true, message: '⚠️ Please select both from and to dates', type: 'warning' });
    }
  };

  const handleClearFilters = () => {
    setSelectedVehicle("");
    setFromDate("");
    setToDate("");
    setHistoricalPoints([]);
    setShowHistory(false);
    setSelectedVehicleData(null);
    setMapCenter([20.5937, 78.9629]);
    setMapZoom(5);
    if (mapInstance) {
      mapInstance.setView([20.5937, 78.9629], 5);
    }
    setSnackbar({ open: true, message: '🧹 Filters cleared', type: 'info' });
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle.id);
    setSelectedVehicleData(vehicle);
    setMapCenter([vehicle.lat, vehicle.lng]);
    setMapZoom(14);
    if (mapInstance) {
      mapInstance.setView([vehicle.lat, vehicle.lng], 14);
    }
    setSnackbar({ open: true, message: `🚛 Selected: ${vehicle.name}`, type: 'info' });
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleCenterMap = () => {
    if (selectedVehicleData) {
      if (mapInstance) {
        mapInstance.setView([selectedVehicleData.lat, selectedVehicleData.lng], 14);
      }
      setSnackbar({ open: true, message: '🎯 Centered on vehicle', type: 'info' });
    } else if (vehicles.length > 0) {
      const bounds = L.latLngBounds(vehicles.map(v => [v.lat, v.lng]));
      const center = bounds.getCenter();
      if (mapInstance) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
      setSnackbar({ open: true, message: '🎯 Showing all vehicles', type: 'info' });
    }
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || '#9e9e9e';
  };

  const handleMapReady = (map: any) => {
    setMapInstance(map);
  };

  return (
    <Box ref={containerRef} sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc", overflow: "hidden" }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
          borderRadius: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              📍 FleetTracker
            </Typography>
            <Chip 
              label={`${stats.total} Active`} 
              size="small" 
              sx={{ 
                bgcolor: "#10b981", 
                color: "white", 
                fontWeight: "bold",
                display: { xs: 'none', sm: 'flex' }
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton 
              size="small" 
              sx={{ color: "white", display: { md: 'none' } }} 
              onClick={() => setDrawerOpen(true)}
            >
              <span style={{ fontSize: 20 }}>📋</span>
            </IconButton>
            <IconButton size="small" sx={{ color: "white" }} onClick={handleClearFilters}>
              <span style={{ fontSize: 20 }}>🔄</span>
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={1} sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
        <Grid item xs={4}>
          <Zoom in>
            <Paper sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
            }}>
              <Typography variant="h5">▶️</Typography>
              <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>{stats.moving}</Typography>
              <Typography variant="caption">MOVING</Typography>
            </Paper>
          </Zoom>
        </Grid>
        <Grid item xs={4}>
          <Zoom in style={{ transitionDelay: '100ms' }}>
            <Paper sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
            }}>
              <Typography variant="h5">⏹️</Typography>
              <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>{stats.stopped}</Typography>
              <Typography variant="caption">STOPPED</Typography>
            </Paper>
          </Zoom>
        </Grid>
        <Grid item xs={4}>
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Paper sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
            }}>
              <Typography variant="h5">🚛</Typography>
              <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>{stats.total}</Typography>
              <Typography variant="caption">TOTAL</Typography>
            </Paper>
          </Zoom>
        </Grid>
      </Grid>

      {/* Filters Bar */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, m: { xs: 1, sm: 2 }, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <Select
              size="small"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              displayEmpty
              fullWidth
              sx={{ bgcolor: "white", borderRadius: 2 }}
            >
              <MenuItem value="">🔍 Select Vehicle</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {vehicleSymbols[v.type as keyof typeof vehicleSymbols]} {v.name} ({v.registrationNumber})
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              type="datetime-local"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              placeholder="From"
              sx={{ bgcolor: "white", borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              type="datetime-local"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              placeholder="To"
              sx={{ bgcolor: "white", borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                fullWidth
                sx={{ 
                  bgcolor: "#10b981", 
                  borderRadius: 2,
                  '&:hover': { bgcolor: "#059669" },
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              >
                🔍 Search
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ flex: 1, position: 'relative', px: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 }, minHeight: 0 }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* Fleet Sidebar - Fixed for desktop */}
          {!isMobile && (
            <Grid item xs={12} md={3} sx={{ height: "100%", overflow: "auto" }}>
              <Paper sx={{ p: 2, borderRadius: 3, height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                  <span>🚛</span> Fleet ({vehicles.length})
                </Typography>
                
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  <Stack spacing={1.5}>
                    {vehicles.map((vehicle) => (
                      <Fade in key={vehicle.id}>
                        <Card 
                          sx={{ 
                            cursor: "pointer",
                            border: selectedVehicleData?.id === vehicle.id ? `2px solid ${getStatusColor(vehicle.status)}` : "1px solid #e2e8f0",
                            transition: "all 0.2s ease",
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                          }}
                          onClick={() => handleVehicleSelect(vehicle)}
                        >
                          <CardContent sx={{ p: 1.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                              <Avatar sx={{ bgcolor: `${getStatusColor(vehicle.status)}20`, width: 40, height: 40 }}>
                                <span style={{ fontSize: 22 }}>{vehicleSymbols[vehicle.type as keyof typeof vehicleSymbols]}</span>
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {vehicle.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {vehicle.registrationNumber}
                                </Typography>
                              </Box>
                              <Chip 
                                label={statusConfig[vehicle.status as keyof typeof statusConfig]?.label}
                                size="small"
                                sx={{ 
                                  bgcolor: `${getStatusColor(vehicle.status)}20`, 
                                  color: getStatusColor(vehicle.status), 
                                  fontWeight: "bold", 
                                  fontSize: "10px",
                                  height: 20
                                }}
                              />
                            </Stack>
                            
                            <Divider sx={{ my: 0.5 }} />
                            
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">⚡</Typography>
                                <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{vehicle.speed} km/h</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">⛽</Typography>
                                <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{vehicle.fuelLevel}%</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">📏</Typography>
                                <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{vehicle.totalDistance} km</Typography>
                              </Box>
                            </Stack>
                            
                            <Typography variant="caption" display="block" color="text.secondary" fontSize="0.7rem" sx={{ mt: 0.5 }}>
                              📍 {vehicle.address.split(',')[0]}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Fade>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Map Panel */}
          <Grid item xs={12} md={!isMobile ? 9 : 12} sx={{ height: "100%" }}>
            <Paper sx={{ height: "100%", borderRadius: 3, overflow: "hidden", position: "relative", boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <MapComponent
                center={mapCenter}
                zoom={mapZoom}
                onMapReady={handleMapReady}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Current Vehicle Markers */}
                {vehicles.map((vehicle) => (
                  <Marker
                    key={vehicle.id}
                    position={[vehicle.lat, vehicle.lng]}
                    icon={createVehicleMarker(vehicle, selectedVehicleData?.id === vehicle.id)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 240, p: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {vehicleSymbols[vehicle.type as keyof typeof vehicleSymbols]} {vehicle.name}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack spacing={0.5}>
                          <Typography variant="caption">📝 {vehicle.registrationNumber}</Typography>
                          <Typography variant="caption">👤 {vehicle.driverName}</Typography>
                          <Typography variant="caption">📞 {vehicle.driverPhone}</Typography>
                          <Typography variant="caption">⚡ {vehicle.speed} km/h</Typography>
                          <Typography variant="caption">⛽ {vehicle.fuelLevel}%</Typography>
                          <Typography variant="caption">📍 {vehicle.address}</Typography>
                          <Typography variant="caption">🕐 {formatDateTime(vehicle.lastUpdated)}</Typography>
                        </Stack>
                        <Button 
                          size="small" 
                          variant="contained" 
                          fullWidth 
                          sx={{ mt: 1, bgcolor: '#10b981' }}
                          onClick={() => handleVehicleSelect(vehicle)}
                        >
                          Track Vehicle
                        </Button>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Historical Route with Dots */}
                {showHistory && historicalPoints.length > 0 && (
                  <>
                    <Polyline
                      positions={historicalPoints.map(p => [p.lat, p.lng])}
                      pathOptions={{ color: "#f59e0b", weight: 3, opacity: 0.8, lineJoin: 'round' }}
                    />
                    
                    {historicalPoints.map((point, index) => (
                      <CircleMarker
                        key={index}
                        center={[point.lat, point.lng]}
                        radius={6}
                        pathOptions={{
                          color: "#f59e0b",
                          fillColor: "#f59e0b",
                          fillOpacity: 0.7,
                        }}
                      >
                        <LeafletTooltip permanent={false} direction="top" offset={[0, -12]}>
                          <Box sx={{ fontSize: 11, bgcolor: 'white', p: 0.5, borderRadius: 1 }}>
                            📍 #{index + 1}<br/>
                            ⏱️ {formatDateTime(point.timestamp)}<br/>
                            ⚡ {Math.round(point.speed)} km/h
                          </Box>
                        </LeafletTooltip>
                      </CircleMarker>
                    ))}
                  </>
                )}
              </MapComponent>

              {/* Map Controls */}
              {mapInstance && (
                <MapControls 
                  map={mapInstance}
                  onCenter={handleCenterMap}
                  onToggleHistory={handleToggleHistory}
                  showHistory={showHistory}
                />
              )}
              
              {/* Fullscreen Button */}
              <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000 }}>
                <FullscreenButton containerRef={containerRef} />
              </Box>
              
              {/* Selected Vehicle Info */}
              {selectedVehicleData && (
                <Fade in>
                  <Paper 
                    sx={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16, 
                      p: 1.5, 
                      maxWidth: 260, 
                      zIndex: 1000,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      boxShadow: 4,
                      borderLeft: `4px solid ${getStatusColor(selectedVehicleData.status)}`,
                    }} 
                    elevation={3}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" fontSize="0.85rem">
                      {vehicleSymbols[selectedVehicleData.type as keyof typeof vehicleSymbols]} {selectedVehicleData.name}
                    </Typography>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">⚡</Typography>
                        <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{selectedVehicleData.speed} km/h</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">⛽</Typography>
                        <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{selectedVehicleData.fuelLevel}%</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">📏</Typography>
                        <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{selectedVehicleData.totalDistance} km</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" display="block" color="text.secondary" fontSize="0.7rem" sx={{ mt: 0.5 }}>
                      👤 {selectedVehicleData.driverName}
                    </Typography>
                  </Paper>
                </Fade>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Historical Points Info */}
      {showHistory && historicalPoints.length > 0 && (
        <Fade in>
          <Paper sx={{ m: 2, p: 1.5, borderRadius: 2, bgcolor: '#fef3c7' }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>📍</span> Historical Route: {historicalPoints.length} points tracked
              <span style={{ fontSize: 12, color: '#f59e0b' }}>●</span> Path
              <span style={{ fontSize: 12, color: '#f59e0b' }}>●</span> Waypoints
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Mobile FAB to open fleet */}
      {isMobile && !drawerOpen && (
        <Zoom in>
          <Fab
            sx={{ position: 'fixed', bottom: 16, left: 16, bgcolor: '#0f172a', color: 'white', '&:hover': { bgcolor: '#1e293b' } }}
            onClick={() => setDrawerOpen(true)}
          >
            <span style={{ fontSize: 24 }}>📋</span>
          </Fab>
        </Zoom>
      )}

      {/* Mobile Drawer for Fleet */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: 280, bgcolor: '#ffffff', borderRadius: '16px 0 0 16px' } }}
        >
          <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexShrink={0}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>🚛</span> Fleet ({vehicles.length})
              </Typography>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <span>✖️</span>
              </IconButton>
            </Stack>
            <Divider />
            <Box sx={{ mt: 2, flex: 1, overflow: "auto" }}>
              <Stack spacing={1.5}>
                {vehicles.map((vehicle) => (
                  <Fade in key={vehicle.id}>
                    <Card 
                      sx={{ 
                        cursor: "pointer",
                        border: selectedVehicleData?.id === vehicle.id ? `2px solid ${getStatusColor(vehicle.status)}` : "1px solid #e2e8f0",
                        transition: "all 0.2s ease",
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Avatar sx={{ bgcolor: `${getStatusColor(vehicle.status)}20`, width: 40, height: 40 }}>
                            <span style={{ fontSize: 22 }}>{vehicleSymbols[vehicle.type as keyof typeof vehicleSymbols]}</span>
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {vehicle.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.registrationNumber}
                            </Typography>
                          </Box>
                          <Chip 
                            label={statusConfig[vehicle.status as keyof typeof statusConfig]?.label}
                            size="small"
                            sx={{ 
                              bgcolor: `${getStatusColor(vehicle.status)}20`, 
                              color: getStatusColor(vehicle.status), 
                              fontWeight: "bold", 
                              fontSize: "10px",
                              height: 20
                            }}
                          />
                        </Stack>
                        
                        <Divider sx={{ my: 0.5 }} />
                        
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">⚡</Typography>
                            <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{vehicle.speed} km/h</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">⛽</Typography>
                            <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{vehicle.fuelLevel}%</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Stack>
            </Box>
          </Box>
        </Drawer>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.type as any} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrackingScreen;