import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Grid, MenuItem, Slider, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'


type RangeKey = 'yearly' | 'monthly' | '15d' | '7d' | '3d' | '1d' | 'hourly'

// const COLORS = ['#FFDE42', '#4C5C2D', '#42A5F5', '#EF5350']
const COLORS = ['#FFDE42', '#4C5C2D', '#42A5F5', '#EF5350', '#9C27B0']

const rangeToMs: Record<RangeKey, number> = {
  yearly: 365 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  '15d': 15 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  hourly: 60 * 60 * 1000,
}

const bucketByZoom = (zoomLevel: number) => {
  if (zoomLevel < 7) return 12 * 60 * 60 * 1000
  if (zoomLevel < 9) return 6 * 60 * 60 * 1000
  if (zoomLevel < 11) return 60 * 60 * 1000
  if (zoomLevel < 13) return 30 * 60 * 1000
  if (zoomLevel < 15) return 10 * 60 * 1000
  if (zoomLevel < 17) return 60 * 1000
  return 1000
}

const AnalyticsScreen = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [rangeKey, setRangeKey] = useState<RangeKey>('monthly')
  const [zoomLevel, setZoomLevel] = useState(10)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [rangePoints, setRangePoints] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingVehicles(true)
        const data = await vehicleMonitorService.getVehicles()
        setVehicles(data.items || [])
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load vehicles')
      } finally {
        setLoadingVehicles(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
  const now = new Date();
  const before = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  setFromDate(before.toISOString().slice(0, 16));
  setToDate(now.toISOString().slice(0, 16));
}, [])

  // useEffect(() => {
  //   if (!vehicleId) return
  //   const loadAnalytics = async () => {
  //     try {
  //       setLoadingAnalytics(true)
  //       const [analyticsData, locations] = await Promise.all([
  //         // vehicleMonitorService.getVehicleAnalytics(vehicleId),

  //         vehicleMonitorService.getVehicleAnalytics(vehicleId, {
  //         from: "2026-04-01T00:00:00Z",
  //         to: "2026-04-21T23:59:59Z",
  //       }),
  //         vehicleMonitorService.getVehicleLocations({
  //           vehicleId,
  //           from: new Date(Date.now() - rangeToMs[rangeKey]).toISOString(),
  //           to: new Date().toISOString(),
  //           limit: 20000,
  //           sortBy: 'time',
  //           sortOrder: 'asc',
  //           excludeSource: 'simulation',
  //         }),
  //       ])

  //       setAnalytics(analyticsData)
  //       setRangePoints(locations.items || [])
  //       setError('')
  //     } catch (e: any) {
  //       setError(e?.error_message || 'Failed to load analytics')
  //     } finally {
  //       setLoadingAnalytics(false)
  //     }
  //   }
  //   loadAnalytics()
  // }, [vehicleId, rangeKey])
  useEffect(() => {
  if (!vehicleId || !fromDate || !toDate) return;

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      const [analyticsData, locations] = await Promise.all([
        vehicleMonitorService.getVehicleAnalytics(vehicleId, {
          from: new Date(fromDate).toISOString(),
          to: new Date(toDate).toISOString(),
        }),

        vehicleMonitorService.getVehicleLocations({
          vehicleId,
          from: new Date(fromDate).toISOString(),
          to: new Date(toDate).toISOString(),
          limit: 20000,
          sortBy: "time",
          sortOrder: "asc",
          excludeSource: "simulation",
        }),
      ]);

      setAnalytics(analyticsData);
      console.log(" ANALYTICS RESPONSE:", analyticsData);
      setRangePoints(locations.items || []);
      setError("");
    } catch (e: any) {
      setError(e?.error_message || "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  loadAnalytics();
}, [vehicleId, fromDate, toDate]);

  const geofenceCols: GridColDef[] = [
    { field: 'geofenceName', headerName: 'Geofence', flex: 1 },
    { field: 'eventType', headerName: 'Event', flex: 0.7 },
    { field: 'enter_time', headerName: 'Time', flex: 1, valueGetter: (_, row) => {
  const d = new Date(row.enter_time)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
} },
    { field: 'speed', headerName: 'Speed', flex: 0.6 },
  ]

  const bucketMs = useMemo(() => bucketByZoom(zoomLevel), [zoomLevel])

  const timelineData = useMemo(() => {
    const map = new Map<number, { time: string; avgSpeed: number; maxSpeed: number; count: number }>()
    for (const p of rangePoints) {
      const t = new Date(p.time).getTime()
      const bucket = Math.floor(t / bucketMs) * bucketMs
      const item = map.get(bucket)
      if (!item) {
        map.set(bucket, {
          time: new Date(bucket).toLocaleString(),
          avgSpeed: p.speed || 0,
          maxSpeed: p.speed || 0,
          count: 1,
        })
      } else {
        item.avgSpeed += p.speed || 0
        item.maxSpeed = Math.max(item.maxSpeed, p.speed || 0)
        item.count += 1
      }
    }
    return Array.from(map.values())
      .map((item) => ({ ...item, avgSpeed: Number((item.avgSpeed / item.count).toFixed(2)) }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [rangePoints, bucketMs])

  const metricBars = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Avg Speed', value: analytics.avgSpeed },
      { name: 'Enter', value: analytics.geofenceEnterCount },
      { name: 'Exit', value: analytics.geofenceExitCount },
      { name: 'Ignition (min)', value: analytics.ignitionOnMinutes },
      { name: 'Harsh Brake', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
       { name: 'SOS', value: analytics.sosCount },
    ]
  }, [analytics])

  const pieData = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Geofence Enter', value: analytics.geofenceEnterCount },
      { name: 'Geofence Exit', value: analytics.geofenceExitCount },
      { name: 'Harsh Braking', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
       { name: 'SOS', value: analytics.sosCount },
    ]
  }, [analytics])

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Vehicle Analytics</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Vehicle' value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={loadingVehicles}>
                {vehicles.map((vehicle) => <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>)}
              </TextField>
            </Grid>
           <Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="From"
    type="datetime-local"
    InputLabelProps={{ shrink: true }}
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="To"
    type="datetime-local"
    InputLabelProps={{ shrink: true }}
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
  />
</Grid>
            <Grid item xs={12} md={2}>
              <Typography variant='caption'>Zoom Level (data expansion): {zoomLevel}</Typography>
              <Slider min={5} max={18} value={zoomLevel} onChange={(_, val) => setZoomLevel(Number(val))} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {(loadingVehicles || loadingAnalytics) && (
        <Card sx={{ mb: 2 }}><CardContent><Stack direction='row' alignItems='center' spacing={2}><CircularProgress size={28} /><Typography>Loading analytics data...</Typography></Stack></CardContent></Card>
      )}

      {analytics && !loadingAnalytics && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[{ label: 'Average Speed', value: `${analytics.avgSpeed} km/h` }, { label: 'Geofence Enter', value: analytics.geofenceEnterCount }, { label: 'Geofence Exit', value: analytics.geofenceExitCount }, { label: 'Ignition On Time', value: `${analytics.ignitionOnMinutes} min` }, { label: 'Harsh Braking', value: analytics.harshBrakingCount }, { label: 'Overspeed', value: analytics.overSpeedCount },{ label: 'SOS Count', value: analytics.sosCount }].map((item) => (
              <Grid item xs={12} sm={6} md={2} key={item.label}><Card><CardContent><Typography variant='caption'>{item.label}</Typography><Typography variant='h6'>{item.value}</Typography></CardContent></Card></Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}><Card><CardContent><Typography variant='h6' mb={1}>Analytics Overview</Typography><Box sx={{ width: '100%', height: 280 }}><ResponsiveContainer><BarChart data={metricBars}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='name' /><YAxis /><Tooltip /><Bar dataKey='value' fill='#FFDE42' radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Box></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' mb={1}>Event Distribution</Typography><Box sx={{ width: '100%', height: 280 }}><ResponsiveContainer><PieChart><Pie data={pieData} dataKey='value' nameKey='name' outerRadius={90} label>{pieData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></Box></CardContent></Card></Grid>
          </Grid>

          {/* <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='h6' mb={1}>Speed Timeline</Typography>
              <Typography variant='caption' color='text.secondary'>Data points auto-expand as zoom increases.</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='time' hide={timelineData.length > 24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type='monotone' dataKey='avgSpeed' stroke='#42A5F5' dot={false} name='Avg Speed' />
                    <Line type='monotone' dataKey='maxSpeed' stroke='#EF5350' dot={false} name='Max Speed' />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card> */}

          <Card><CardContent><Typography variant='h6' mb={1}>Geofence Logs</Typography><div style={{ height: 320 }}><DataGrid rows={(analytics.geofenceLogs || []).map((x: any) => ({ ...x, id: x._id }))} columns={geofenceCols} /></div></CardContent></Card>
          <Card sx={{ mt: 2 }}>
  <CardContent>
    <Typography variant='h6' mb={1}>SOS Logs</Typography>

    <div style={{ height: 320 }}>
      <DataGrid
        rows={(analytics.sosLogs || []).map((x: any) => ({
          ...x,
          id: x._id,
        }))}
        columns={[
          {
            field: "createdAt",
            headerName: "Time",
            flex: 1,
            valueGetter: (_, row) => {
  const d = new Date(row.createdAt)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
},
          },
          {
            field: "status",
            headerName: "Status",
            flex: 1,
          },
        ]}
      />
    </div>
  </CardContent>
</Card>
        </>
      )}
    </Box>
  )
}

export default AnalyticsScreen
