import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import LayersIcon from '@mui/icons-material/Layers'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { socket } from '../../services/socket'
import 'leaflet/dist/leaflet.css'

// Create a web worker for data processing
const dataWorker = new Worker(new URL('./dataWorker.ts', import.meta.url))

type VehicleOption = { _id: string; vehicleNumber: string }
type LocationPoint = {
  _id: string
  latitude: number
  longitude: number
  speed: number
  time: string
}

type AggregatedPoint = {
  center: [number, number]
  count: number
  avgSpeed: number
  minTime: string
  maxTime: string
  samplePoints?: LocationPoint[]
}

type ViewMode = 'auto' | 'points' | 'aggregated'

const LocationHistory = () => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [points, setPoints] = useState<LocationPoint[]>([])
  const [aggregatedPoints, setAggregatedPoints] = useState<AggregatedPoint[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [loadedRecords, setLoadedRecords] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('auto')
  const [zoomLevel, setZoomLevel] = useState(8)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const activeQueryRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Process data in web worker
  useEffect(() => {
    dataWorker.onmessage = (e) => {
      const { type, data } = e.data
      if (type === 'processedPoints') {
        setPoints(prev => {
          // Use Map for deduplication
          const pointMap = new Map(prev.map(p => [p._id, p]))
          data.forEach((point: LocationPoint) => {
            if (!pointMap.has(point._id)) {
              pointMap.set(point._id, point)
            }
          })
          return Array.from(pointMap.values())
        })
      } else if (type === 'aggregatedData') {
        setAggregatedPoints(data)
      }
    }
    return () => {
      dataWorker.terminate()
    }
  }, [])

  const loadVehicles = async () => {
    try {
      const data = await vehicleMonitorService.getVehicles()
      setVehicles(data.items || [])
    } catch (e: any) {
      setError(e?.error_message || 'Unable to load vehicles')
    }
  }

  useEffect(() => {
    loadVehicles()

    const onReset = () => {
      setPoints([])
      setAggregatedPoints([])
      setLoadedRecords(0)
      setMapReady(false)
      setCurrentPage(1)
      setHasMore(true)
    }

    const onStart = (payload: { total?: number }) => {
      setTotalRecords(payload?.total || 0)
      setLoadedRecords(0)
      setLoading(true)
      setMapReady(false)
      setCurrentPage(1)
      setHasMore(true)
    }

    const onBatch = (records: LocationPoint[]) => {
      if (!Array.isArray(records) || records.length === 0) return
      
      // Send to web worker for processing
      dataWorker.postMessage({
        type: 'processPoints',
        data: records,
        currentPoints: points
      })
      
      setLoadedRecords(prev => prev + records.length)
    }

    const onAggregatedBatch = (aggregated: AggregatedPoint[]) => {
      if (!Array.isArray(aggregated)) return
      setAggregatedPoints(prev => [...prev, ...aggregated])
      setLoadedRecords(prev => prev + aggregated.reduce((sum, a) => sum + a.count, 0))
    }

    const onProgress = (payload: { loaded: number; total: number }) => {
      setLoadedRecords(payload.loaded)
      setTotalRecords(payload.total)
    }

    const onDone = () => {
      setLoading(false)
      setMapReady(true)
      setHasMore(false)
    }

    const onError = (payload: { message?: string }) => {
      setLoading(false)
      setMapReady(false)
      setError(payload?.message || 'Failed to stream location history')
    }

    socket.on('locationHistory:reset', onReset)
    socket.on('locationHistory:start', onStart)
    socket.on('locationHistory:batch', onBatch)
    socket.on('locationHistory:aggregatedBatch', onAggregatedBatch)
    socket.on('locationHistory:progress', onProgress)
    socket.on('locationHistory:done', onDone)
    socket.on('locationHistory:error', onError)

    return () => {
      socket.emit('locationHistory:unsubscribe')
      socket.off('locationHistory:reset', onReset)
      socket.off('locationHistory:start', onStart)
      socket.off('locationHistory:batch', onBatch)
      socket.off('locationHistory:aggregatedBatch', onAggregatedBatch)
      socket.off('locationHistory:progress', onProgress)
      socket.off('locationHistory:done', onDone)
      socket.off('locationHistory:error', onError)
    }
  }, [])

  const fetchHistory = useCallback(() => {
    if (!selectedVehicle || !fromDate || !toDate) {
      setError('Please select vehicle and both date-time filters')
      return
    }

    // Determine if we should use aggregation based on expected data size
    const dateRange = new Date(toDate).getTime() - new Date(fromDate).getTime()
    const estimatedPoints = dateRange / (1000 * 60) // Rough estimate: 1 point per minute
    const useAggregation = estimatedPoints > 50000 || viewMode === 'aggregated'
    
    const payload = {
      vehicleId: selectedVehicle,
      from: new Date(fromDate).toISOString(),
      to: new Date(toDate).toISOString(),
      pageSize: 5000,
      page: currentPage,
      useAggregation: useAggregation || viewMode === 'aggregated',
      zoomLevel: zoomLevel
    }

    setError('')
    setLoading(true)
    setPoints([])
    setAggregatedPoints([])
    setMapReady(false)
    setLoadedRecords(0)
    setTotalRecords(0)

    activeQueryRef.current = payload
    socket.emit('locationHistory:unsubscribe')
    socket.emit('locationHistory:subscribe', payload)
  }, [selectedVehicle, fromDate, toDate, viewMode, zoomLevel, currentPage])

  // Load more on scroll
  useEffect(() => {
    if (!listRef.current) return
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && viewMode === 'points') {
          setCurrentPage(prev => prev + 1)
          fetchHistory()
        }
      },
      { threshold: 0.1 }
    )
    
    observerRef.current.observe(listRef.current)
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, viewMode, fetchHistory])

  const mapCenter = useMemo<[number, number]>(() => {
    if (points.length > 0) return [points[0].latitude, points[0].longitude]
    if (aggregatedPoints.length > 0) return aggregatedPoints[0].center
    return [22.9734, 78.6569]
  }, [points, aggregatedPoints])

  const progressValue = totalRecords > 0 ? Math.min((loadedRecords / totalRecords) * 100, 100) : 0

  const downloadCsv = async () => {
    if (points.length === 0) return
    
    // For large datasets, show warning and download in chunks
    if (points.length > 100000) {
      if (!confirm(`You're about to download ${points.length.toLocaleString()} records. This may take a while. Continue?`)) {
        return
      }
    }
    
    // Use streaming for large downloads
    const csvHeader = 'time,latitude,longitude,speed\n'
    const chunks = []
    
    for (let i = 0; i < points.length; i += 10000) {
      const chunk = points.slice(i, i + 10000)
      const csvRows = chunk.map(point => 
        `${new Date(point.time).toISOString()},${point.latitude},${point.longitude},${point.speed}`
      ).join('\n')
      chunks.push(csvRows)
      
      // Allow UI to breathe
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    const blob = new Blob([csvHeader + chunks.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `location-history-${selectedVehicle}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Component to track zoom level
  const ZoomTracker = () => {
    const map = useMapEvents({
      zoomend: () => {
        const newZoom = map.getZoom()
        setZoomLevel(newZoom)
        
        // Refetch with new zoom level if needed
        if (viewMode === 'auto' && newZoom !== zoomLevel) {
          const shouldUseAggregation = newZoom < 10 && points.length > 50000
          if (shouldUseAggregation !== (viewMode === 'aggregated')) {
            fetchHistory()
          }
        }
      },
    })
    return null
  }

  const getVisiblePoints = useMemo(() => {
    if (viewMode === 'aggregated' || (viewMode === 'auto' && zoomLevel < 10 && aggregatedPoints.length > 0)) {
      return aggregatedPoints
    }
    // Limit points for performance
    return points.slice(0, 50000)
  }, [points, aggregatedPoints, viewMode, zoomLevel])

  const MapView = (
    <Box sx={{ height: 520, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoomLevel} 
        preferCanvas 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <ZoomTracker />
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' 
        />
        
        {getVisiblePoints.map((item, idx) => {
          // Check if it's an aggregated point
          if ('count' in item && item.count > 1) {
            const cluster = item as AggregatedPoint
            return (
              <CircleMarker
                key={`cluster-${idx}`}
                center={cluster.center}
                radius={Math.min(25, 5 + Math.log(cluster.count) * 2)}
                pathOptions={{ 
                  color: '#FFDE42', 
                  fillOpacity: 0.8,
                  weight: 2,
                  fillColor: cluster.count > 1000 ? '#FF6B42' : '#FFDE42'
                }}
              >
                <Popup>
                  <Stack spacing={0.5}>
                    <Typography variant='body2'><strong>Points:</strong> {cluster.count.toLocaleString()}</Typography>
                    <Typography variant='body2'><strong>Avg Speed:</strong> {cluster.avgSpeed.toFixed(1)} km/h</Typography>
                    <Typography variant='body2'><strong>Time Range:</strong></Typography>
                    <Typography variant='caption'>{new Date(cluster.minTime).toLocaleString()}</Typography>
                    <Typography variant='caption'>to</Typography>
                    <Typography variant='caption'>{new Date(cluster.maxTime).toLocaleString()}</Typography>
                    {cluster.samplePoints && cluster.samplePoints.length > 0 && (
                      <Button size="small" onClick={() => {
                        // Zoom in to show details
                        if (mapRef.current) {
                          mapRef.current.setView(cluster.center, 15)
                        }
                      }}>
                        Zoom in for details
                      </Button>
                    )}
                  </Stack>
                </Popup>
              </CircleMarker>
            )
          } else {
            const point = item as LocationPoint
            return (
              <CircleMarker
                key={point._id || `${point.time}-${idx}`}
                center={[point.latitude, point.longitude]}
                radius={3}
                pathOptions={{ color: '#FFDE42', fillOpacity: 0.8 }}
              >
                <Popup>
                  <Stack spacing={0.5}>
                    <Typography variant='body2'><strong>Time:</strong> {new Date(point.time).toLocaleString()}</Typography>
                    <Typography variant='body2'><strong>Speed:</strong> {point.speed} km/h</Typography>
                    <Typography variant='body2'><strong>Lat:</strong> {point.latitude.toFixed(6)}</Typography>
                    <Typography variant='body2'><strong>Lng:</strong> {point.longitude.toFixed(6)}</Typography>
                  </Stack>
                </Popup>
              </CircleMarker>
            )
          }
        })}
      </MapContainer>
    </Box>
  )

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' mb={2}>Location History (Optimized Stream)</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{String(error)}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={3}>
              <TextField 
                fullWidth 
                select 
                label='Vehicle' 
                value={selectedVehicle} 
                onChange={e => setSelectedVehicle(e.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField 
                fullWidth 
                type='datetime-local' 
                label='From' 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                InputLabelProps={{ shrink: true }} 
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField 
                fullWidth 
                type='datetime-local' 
                label='To' 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                InputLabelProps={{ shrink: true }} 
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                fullWidth 
                variant='contained' 
                onClick={fetchHistory} 
                disabled={loading} 
                sx={{ height: '56px' }}
              >
                {loading ? 'Streaming...' : 'Stream History'}
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(e, val) => val && setViewMode(val)}
                sx={{ height: '56px' }}
                fullWidth
              >
                <ToggleButton value="auto">Auto</ToggleButton>
                <ToggleButton value="points">Points</ToggleButton>
                <ToggleButton value="aggregated">Aggregated</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant='body2'>
                Loaded {loadedRecords.toLocaleString()} / {totalRecords?.toLocaleString() || '?'} records
                {aggregatedPoints.length > 0 && ` | ${aggregatedPoints.length} clusters`}
              </Typography>
              <Typography variant='caption' color="text.secondary">
                Zoom level: {zoomLevel}
              </Typography>
            </Stack>
            <LinearProgress 
              variant={totalRecords > 0 ? 'determinate' : 'indeterminate'} 
              value={progressValue} 
              sx={{ mt: 0.5 }}
            />
          </Box>
        </CardContent>
      </Card>

      {mapReady && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack direction='row' justifyContent='space-between' spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getVisiblePoints.length.toLocaleString()} points displayed
                    {viewMode === 'auto' && zoomLevel < 10 && ' (clustered view)'}
                  </Typography>
                  <Stack direction='row' spacing={1}>
                    <Button 
                      size='small' 
                      startIcon={<DownloadIcon />} 
                      variant='outlined' 
                      onClick={downloadCsv}
                      disabled={points.length === 0}
                    >
                      Download CSV
                    </Button>
                    <IconButton size='small' onClick={() => setFullscreenOpen(true)}>
                      <FullscreenIcon />
                    </IconButton>
                  </Stack>
                </Stack>
                {MapView}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={1}>Summary Statistics</Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Total Points: {points.length.toLocaleString()}
                  </Typography>
                  {points.length > 0 && (
                    <>
                      <Typography variant="body2">
                        Time Range: {new Date(points[0].time).toLocaleDateString()} - {new Date(points[points.length - 1].time).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        Avg Speed: {(points.reduce((sum, p) => sum + p.speed, 0) / points.length).toFixed(1)} km/h
                      </Typography>
                      <Typography variant="body2">
                        Max Speed: {Math.max(...points.map(p => p.speed))} km/h
                      </Typography>
                    </>
                  )}
                </Stack>
                
                <Typography variant='h6' mb={1}>Recent Points (last 100)</Typography>
                <Box 
                  ref={listRef}
                  sx={{ maxHeight: 380, overflowY: 'auto' }}
                >
                  {points.slice(-100).reverse().map((point, idx) => (
                    <Box 
                      key={point._id || idx} 
                      sx={{ 
                        py: 1, 
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.setView([point.latitude, point.longitude], 15)
                        }
                      }}
                    >
                      <Typography variant='body2'>
                        {new Date(point.time).toLocaleString()}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Speed: {point.speed} km/h | Lat: {point.latitude.toFixed(4)} | Lng: {point.longitude.toFixed(4)}
                      </Typography>
                    </Box>
                  ))}
                  {loading && hasMore && (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <LinearProgress />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog fullScreen open={fullscreenOpen} onClose={() => setFullscreenOpen(false)}>
        <DialogContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='h6'>Location History Map</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {MapView}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default LocationHistory