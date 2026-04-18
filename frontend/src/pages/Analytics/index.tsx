import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const COLORS = ['#FFDE42', '#4C5C2D', '#42A5F5', '#EF5350']

const AnalyticsScreen = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

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
    if (!vehicleId) return
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true)
        const data = await vehicleMonitorService.getVehicleAnalytics(vehicleId)
        setAnalytics(data)
        setError('')
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load analytics')
      } finally {
        setLoadingAnalytics(false)
      }
    }
    loadAnalytics()
  }, [vehicleId])

  const geofenceCols: GridColDef[] = [
    { field: 'geofenceName', headerName: 'Geofence', flex: 1 },
    { field: 'eventType', headerName: 'Event', flex: 0.7 },
    {
      field: 'enter_time',
      headerName: 'Time',
      flex: 1,
      valueGetter: (_, row) => new Date(row.enter_time).toLocaleString(),
    },
    { field: 'speed', headerName: 'Speed', flex: 0.6 },
    { field: 'latitude', headerName: 'Lat', flex: 0.8 },
    { field: 'longitude', headerName: 'Lng', flex: 0.8 },
  ]

  const metricBars = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Avg Speed', value: analytics.avgSpeed },
      { name: 'Enter', value: analytics.geofenceEnterCount },
      { name: 'Exit', value: analytics.geofenceExitCount },
      { name: 'Ignition (min)', value: analytics.ignitionOnMinutes },
      { name: 'Harsh Brake', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
    ]
  }, [analytics])

  const pieData = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Geofence Enter', value: analytics.geofenceEnterCount },
      { name: 'Geofence Exit', value: analytics.geofenceExitCount },
      { name: 'Harsh Braking', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
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
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {(loadingVehicles || loadingAnalytics) && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction='row' alignItems='center' spacing={2}>
              <CircularProgress size={28} />
              <Typography variant='body1'>Loading analytics data...</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {analytics && !loadingAnalytics && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { label: 'Average Speed', value: `${analytics.avgSpeed} km/h` },
              { label: 'Geofence Enter', value: analytics.geofenceEnterCount },
              { label: 'Geofence Exit', value: analytics.geofenceExitCount },
              { label: 'Ignition On Time', value: `${analytics.ignitionOnMinutes} min` },
              { label: 'Harsh Braking', value: analytics.harshBrakingCount },
              { label: 'Overspeed', value: analytics.overSpeedCount },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={2} key={item.label}>
                <Card>
                  <CardContent>
                    <Typography variant='caption'>{item.label}</Typography>
                    <Typography variant='h6'>{item.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant='h6' mb={1}>Analytics Overview</Typography>
                  <Box sx={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={metricBars}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='name' />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey='value' fill='#FFDE42' radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='h6' mb={1}>Event Distribution</Typography>
                  <Box sx={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} dataKey='value' nameKey='name' outerRadius={90} label>
                          {pieData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={1}>Geofence Logs</Typography>
                <div style={{ height: 320 }}>
                  <DataGrid rows={(analytics.geofenceLogs || []).map((x: any) => ({ ...x, id: x._id }))} columns={geofenceCols} />
                </div>
              </CardContent>
            </Card>
          </Stack>
        </>
      )}
    </Box>
  )
}

export default AnalyticsScreen
