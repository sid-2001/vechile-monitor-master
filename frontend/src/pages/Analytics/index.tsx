import { useEffect, useState } from 'react'
import { Alert, Box, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

const AnalyticsScreen = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await vehicleMonitorService.getVehicles()
        setVehicles(data.items || [])
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load vehicles')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!vehicleId) return
    const loadAnalytics = async () => {
      try {
        const data = await vehicleMonitorService.getVehicleAnalytics(vehicleId)
        setAnalytics(data)
        setError('')
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load analytics')
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

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Vehicle Analytics</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Vehicle' value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {analytics && (
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
