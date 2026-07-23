import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material'

import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

import MuiAlert from '@mui/material/Alert'

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from 'react-leaflet'

import {
  AccessTimeRounded,
  DownloadRounded,
  InfoOutlined,
  LightModeRounded,
  NightsStayRounded,
  RefreshRounded,
  RestartAltRounded,
  SaveRounded,
  SettingsRounded,
} from '@mui/icons-material'

import { vehicleMonitorService } from '../../services/vehicle-monitor.service'

type Vehicle = {
  _id: string
  vehicleNumber: string
  vehicle_tag_name?: string
  deviceId?: string

  baseId?: {
    _id?: string
    name?: string
  } | string

  driverId?: {
    _id?: string
    username?: string
  } | string
}

type HaltConfig = {
  _id?: string
  vehicleId: string

  dayHalt: {
    enabled: boolean
    windowStartTime: string
    windowEndTime: string
    minimumDurationMinutes: number
  }

  nightHalt: {
    enabled: boolean
    windowStartTime: string
    windowEndTime: string
    minimumDurationMinutes: number
  }

  detection: {
    stationaryRadiusMeters: number
    stationarySpeedThreshold: number
    stationaryConfirmationPackets: number
    movementConfirmationPackets: number
    maxPacketGapSeconds: number
    gpsJumpSpeedMultiplier: number
  }
}

type HaltHistory = {
  _id: string

  vehicleId?: {
    _id: string
    vehicleNumber: string
    vehicle_tag_name?: string
  }

  startedAt: string
  endedAt: string

  durationSeconds: number

  anchorLocation: {
    latitude: number
    longitude: number
  }

  lastLocation?: {
    latitude: number
    longitude: number
  }

  dayDurationSeconds: number
  nightDurationSeconds: number

  dayHaltQualified: boolean
  nightHaltQualified: boolean

  classification:
    | 'STOP'
    | 'DAY_HALT'
    | 'NIGHT_HALT'
    | 'DAY_AND_NIGHT_HALT'

  completionReason: string

  gpsPacketCount: number

  hasDataGap: boolean
  dataGapSeconds: number
}

const DEFAULT_CONFIG: HaltConfig = {
  vehicleId: '',

  dayHalt: {
    enabled: true,
    windowStartTime: '06:00',
    windowEndTime: '17:00',
    minimumDurationMinutes: 30,
  },

  nightHalt: {
    enabled: true,
    windowStartTime: '17:00',
    windowEndTime: '06:00',
    minimumDurationMinutes: 60,
  },

  detection: {
    stationaryRadiusMeters: 50,
    stationarySpeedThreshold: 2,
    stationaryConfirmationPackets: 3,
    movementConfirmationPackets: 3,
    maxPacketGapSeconds: 300,
    gpsJumpSpeedMultiplier: 2,
  },
}

const compactFieldSx = {
  '& .MuiInputBase-root': {
    height: 38,
    fontSize: 13,
  },

  '& .MuiInputLabel-root': {
    fontSize: 13,
  },

  '& input': {
    py: 0.8,
  },
}

const sectionCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  boxShadow: 'none',
  height: '100%',
}

const formatDuration = (
  seconds: number
): string => {
  const value = Number(seconds || 0)

  const hours = Math.floor(value / 3600)

  const minutes = Math.floor(
    (value % 3600) / 60
  )

  const secs = value % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }

  return `${secs}s`
}

const formatDate = (
  value: string
): string => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

const getClassificationLabel = (
  classification: HaltHistory['classification']
) => {
  switch (classification) {
    case 'DAY_HALT':
      return 'DAY HALT'

    case 'NIGHT_HALT':
      return 'NIGHT HALT'

    case 'DAY_AND_NIGHT_HALT':
      return 'DAY + NIGHT'

    default:
      return 'STOP'
  }
}

const HaltConfiguration = () => {
  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([])

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState('')

  const today = new Date()
  .toISOString()
  .split('T')[0]

const [fromDate, setFromDate] =
  useState(today)

const [toDate, setToDate] =
  useState(today)

  const [config, setConfig] =
    useState<HaltConfig>(DEFAULT_CONFIG)

  const [halts, setHalts] = useState<
    HaltHistory[]
  >([])

  const [loading, setLoading] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] = useState('')

  const [snack, setSnack] = useState('')

  const [showDayHalt, setShowDayHalt] =
    useState(true)

  const [
    showNightHalt,
    setShowNightHalt,
  ] = useState(true)

  const [showStops, setShowStops] =
    useState(true)

    const [mapFullscreenOpen, setMapFullscreenOpen] = useState(false)
  const selectedVehicle = useMemo(
    () =>
      vehicles.find(
        vehicle =>
          vehicle._id === selectedVehicleId
      ),
    [vehicles, selectedVehicleId]
  )

  const filteredMapHalts = useMemo(() => {
    return halts.filter(halt => {
      if (
        halt.classification === 'DAY_HALT'
      ) {
        return showDayHalt
      }

      if (
        halt.classification === 'NIGHT_HALT'
      ) {
        return showNightHalt
      }

      if (
        halt.classification ===
        'DAY_AND_NIGHT_HALT'
      ) {
        return (
          showDayHalt || showNightHalt
        )
      }

      return showStops
    })
  }, [
    halts,
    showDayHalt,
    showNightHalt,
    showStops,
  ])

  const mapCenter = useMemo<
    [number, number]
  >(() => {
    const first =
      filteredMapHalts[0] || halts[0]

    if (!first?.anchorLocation) {
      return [28.6139, 77.209]
    }

    return [
      Number(first.anchorLocation.latitude),
      Number(first.anchorLocation.longitude),
    ]
  }, [filteredMapHalts, halts])



  const haltMap = (
  <MapContainer
    key={`${selectedVehicleId}-${mapCenter[0]}-${mapCenter[1]}`}
    center={mapCenter}
    zoom={7}
    style={{
      height: '100%',
      width: '100%',
    }}
  >
    <TileLayer
      attribution='&copy; OpenStreetMap contributors'
      url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    />

    {filteredMapHalts.map(halt => {
      const isDay =
        halt.classification ===
        'DAY_HALT'

      const isNight =
        halt.classification ===
        'NIGHT_HALT'

      const markerColor = isDay
        ? '#FFB300'
        : isNight
          ? '#2196F3'
          : '#78909C'

      return (
        <CircleMarker
          key={halt._id}
          center={[
            halt.anchorLocation.latitude,
            halt.anchorLocation.longitude,
          ]}
          radius={8}
          pathOptions={{
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip>
            {getClassificationLabel(
              halt.classification
            )}
          </Tooltip>

          <Popup>
            <Stack spacing={0.5}>
              <Typography
                variant='body2'
                fontWeight={700}
              >
                {getClassificationLabel(
                  halt.classification
                )}
              </Typography>

              <Typography variant='caption'>
                Start: {formatDate(halt.startedAt)}
              </Typography>

              <Typography variant='caption'>
                End: {formatDate(halt.endedAt)}
              </Typography>

              <Typography variant='caption'>
                Duration:{' '}
                {formatDuration(
                  halt.durationSeconds
                )}
              </Typography>

              <Typography variant='caption'>
                GPS Packets:{' '}
                {halt.gpsPacketCount}
              </Typography>
            </Stack>
          </Popup>
        </CircleMarker>
      )
    })}
  </MapContainer>
)
  const loadVehicles = async () => {
    try {
      setLoading(true)
      setError('')

      const data =
        await vehicleMonitorService.getVehicles()

      const items = data?.items || []

      setVehicles(items)

      if (
        items.length &&
        !selectedVehicleId
      ) {
        setSelectedVehicleId(items[0]._id)
      }
    } catch (e: any) {
      setError(
        e?.error_message ||
          'Unable to load vehicles'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleData = async (
     vehicleId: string,
  fromDate?: string,
  toDate?: string
  ) => {
    if (!vehicleId) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const [configData, historyData] =
        await Promise.all([
          vehicleMonitorService
            .getVehicleHaltConfigByVehicle(vehicleId)
            .catch(() => null),

          vehicleMonitorService
            .getVehicleStopHistory({
              vehicleId,
              page: 1,
              limit: 1000,
               fromDate,
               toDate,
            }),
        ])

      const configItem =
        configData?.items?.[0] ||
        configData?.item ||
        configData?.data ||
        configData

      if (
        configItem &&
        configItem.vehicleId
      ) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...configItem,

          dayHalt: {
            ...DEFAULT_CONFIG.dayHalt,
            ...(configItem.dayHalt || {}),
          },

          nightHalt: {
            ...DEFAULT_CONFIG.nightHalt,
            ...(configItem.nightHalt || {}),
          },

          detection: {
            ...DEFAULT_CONFIG.detection,
            ...(configItem.detection || {}),
          },
        })
      } else {
        setConfig({
          ...DEFAULT_CONFIG,
          vehicleId,
        })
      }

      setHalts(historyData?.items || [])
    } catch (e: any) {
      setError(
        e?.error_message ||
          'Unable to load halt information'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

 useEffect(() => {
  if (selectedVehicleId) {
    loadVehicleData(
      selectedVehicleId,
      fromDate,
      toDate
    )
  }
}, [
  selectedVehicleId,
  fromDate,
  toDate,
])

  const updateDayHalt = (
    field: keyof HaltConfig['dayHalt'],
    value: string | number | boolean
  ) => {
    setConfig(previous => ({
      ...previous,

      dayHalt: {
        ...previous.dayHalt,
        [field]: value,
      },
    }))
  }

  const updateNightHalt = (
    field: keyof HaltConfig['nightHalt'],
    value: string | number | boolean
  ) => {
    setConfig(previous => ({
      ...previous,

      nightHalt: {
        ...previous.nightHalt,
        [field]: value,
      },
    }))
  }

  const updateDetection = (
    field: keyof HaltConfig['detection'],
    value: number
  ) => {
    setConfig(previous => ({
      ...previous,

      detection: {
        ...previous.detection,
        [field]: value,
      },
    }))
  }

  const saveConfiguration = async () => {
    if (!selectedVehicleId) {
      setError('Please select a vehicle')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        vehicleId: selectedVehicleId,

        dayHalt: config.dayHalt,

        nightHalt: config.nightHalt,

        detection: config.detection,
      }

      if (config._id) {
        await vehicleMonitorService
          .updateVehicleHaltConfig(
            config._id,
            payload
          )
      } else {
        await vehicleMonitorService
          .createVehicleHaltConfig(payload)
      }

      setSnack(
        'Halt configuration saved successfully'
      )

   await loadVehicleData(
  selectedVehicleId,
  fromDate,
  toDate
)
    } catch (e: any) {
      setError(
        e?.error_message ||
          'Failed to save configuration'
      )
    } finally {
      setSaving(false)
    }
  }

  const resetConfiguration = () => {
    setConfig({
      ...DEFAULT_CONFIG,
      vehicleId: selectedVehicleId,
    })
  }

  const downloadCsv = () => {
    if (!halts.length) {
      return
    }

    const header = [
      'Vehicle',
      'Halt Type',
      'Start Time',
      'End Time',
      'Duration Seconds',
      'Latitude',
      'Longitude',
      'Day Qualified',
      'Night Qualified',
      'Completion Reason',
      'GPS Packets',
    ].join(',')

    const rows = halts.map(halt =>
      [
        halt.vehicleId?.vehicleNumber || '',
        halt.classification,
        halt.startedAt,
        halt.endedAt,
        halt.durationSeconds,
        halt.anchorLocation?.latitude,
        halt.anchorLocation?.longitude,
        halt.dayHaltQualified,
        halt.nightHaltQualified,
        halt.completionReason,
        halt.gpsPacketCount,
      ].join(',')
    )

    const blob = new Blob(
      [[header, ...rows].join('\n')],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `halt-history-${
      selectedVehicle?.vehicleNumber ||
      selectedVehicleId
    }.csv`

    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Box
      sx={{
        maxWidth: 1700,
        mx: 'auto',
        width: '100%',
        p: {
          xs: 1,
          md: 2,
        },
      }}
    >
      <Stack
        direction={{
          xs: 'column',
          md: 'row',
        }}
        justifyContent='space-between'
        alignItems={{
          xs: 'stretch',
          md: 'flex-end',
        }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 700,
              mb: 0.3,
            }}
          >
            Halt Configuration
          </Typography>

          <Typography
            variant='body2'
            color='text.secondary'
          >
            Configure day halt, night halt
            windows and detection parameters
            for vehicles
          </Typography>
        </Box>

        <Stack
          direction='row'
          spacing={1}
          alignItems='flex-end'
        >
          <TextField
            select
            label='Select Vehicle'
            value={selectedVehicleId}
            onChange={event =>
              setSelectedVehicleId(
                event.target.value
              )
            }
            sx={{
              ...compactFieldSx,
              minWidth: 300,
            }}
          >
            {vehicles.map(vehicle => (
              <MenuItem
                key={vehicle._id}
                value={vehicle._id}
              >
                {vehicle.vehicleNumber}
                {vehicle.vehicle_tag_name
                  ? ` (${vehicle.vehicle_tag_name})`
                  : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
  label="From Date"
  type="date"
  size="small"
  value={fromDate}
  onChange={(e) =>
    setFromDate(e.target.value)
  }
  InputLabelProps={{
    shrink: true,
  }}
  sx={{ width: 170 }}
/>

<TextField
  label="To Date"
  type="date"
  size="small"
  value={toDate}
  onChange={(e) =>
    setToDate(e.target.value)
  }
  InputLabelProps={{
    shrink: true,
  }}
  sx={{ width: 170 }}
/>

          <Button
            variant='contained'
            startIcon={<RefreshRounded />}
            onClick={() =>
  selectedVehicleId &&
  loadVehicleData(
    selectedVehicleId,
    fromDate,
    toDate
  )
}
            sx={{
              height: 38,
              whiteSpace: 'nowrap',
            }}
          >
            Reload
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Card
        sx={{
          ...sectionCardSx,
          mb: 1.5,
        }}
      >
        <CardContent
          sx={{
            py: '14px !important',
          }}
        >
          <Grid
            container
            alignItems='center'
            spacing={1}
          >
            <Grid item xs={12} md={2}>
              <Typography fontWeight={700}>
                Vehicle Info
              </Typography>
            </Grid>

            {[
              {
                label: 'Vehicle Number',
                value:
                  selectedVehicle?.vehicleNumber,
              },
              {
                label: 'Vehicle Tag Name',
                value:
                  selectedVehicle?.vehicle_tag_name,
              },
              {
                label: 'Device ID',
                value:
                  selectedVehicle?.deviceId,
              },
              {
                label: 'Base',
                value:
                  typeof selectedVehicle?.baseId ===
                  'object'
                    ? selectedVehicle.baseId
                        ?.name
                    : selectedVehicle?.baseId,
              },
              {
                label: 'Operator',
                value:
                  typeof selectedVehicle?.driverId ===
                  'object'
                    ? selectedVehicle.driverId
                        ?.username
                    : selectedVehicle?.driverId,
              },
            ].map(item => (
              <Grid
                item
                xs={6}
                md={2}
                key={item.label}
              >
                <Box
                  sx={{
                    borderLeft: {
                      md: '1px solid',
                    },
                    borderColor: 'divider',
                    pl: {
                      md: 2,
                    },
                  }}
                >
                  <Typography
                    variant='caption'
                    color='warning.main'
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    variant='body2'
                    sx={{
                      mt: 0.2,
                      fontWeight: 500,
                    }}
                  >
                    {item.value || '-'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid
        container
        spacing={1.5}
        mb={1.5}
      >
        <Grid item xs={12} md={6}>
          <Card sx={sectionCardSx}>
            <CardContent>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                >
                  <LightModeRounded color='warning' />

                  <Typography fontWeight={700}>
                    Day Halt Configuration
                  </Typography>
                </Stack>

                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        config.dayHalt.enabled
                      }
                      onChange={event =>
                        updateDayHalt(
                          'enabled',
                          event.target.checked
                        )
                      }
                      color='warning'
                    />
                  }
                  label={
                    config.dayHalt.enabled
                      ? 'Enabled'
                      : 'Disabled'
                  }
                />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Grid
                container
                spacing={1.5}
              >
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='time'
                    label='Window Start Time'
                    value={
                      config.dayHalt
                        .windowStartTime
                    }
                    onChange={event =>
                      updateDayHalt(
                        'windowStartTime',
                        event.target.value
                      )
                    }
                    disabled={
                      !config.dayHalt.enabled
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={compactFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='time'
                    label='Window End Time'
                    value={
                      config.dayHalt
                        .windowEndTime
                    }
                    onChange={event =>
                      updateDayHalt(
                        'windowEndTime',
                        event.target.value
                      )
                    }
                    disabled={
                      !config.dayHalt.enabled
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={compactFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Minimum Duration (mins)'
                    value={
                      config.dayHalt
                        .minimumDurationMinutes
                    }
                    onChange={event =>
                      updateDayHalt(
                        'minimumDurationMinutes',
                        Number(
                          event.target.value
                        )
                      )
                    }
                    disabled={
                      !config.dayHalt.enabled
                    }
                    sx={compactFieldSx}
                  />
                </Grid>
              </Grid>

              <Alert
                severity='warning'
                icon={<InfoOutlined />}
                sx={{
                  mt: 1.5,
                  py: 0,
                  fontSize: 12,
                }}
              >
                A day halt is recorded when the
                vehicle remains stationary inside
                the configured window for the
                minimum duration.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={sectionCardSx}>
            <CardContent>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                >
                  <NightsStayRounded color='warning' />

                  <Typography fontWeight={700}>
                    Night Halt Configuration
                  </Typography>
                </Stack>

                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        config.nightHalt.enabled
                      }
                      onChange={event =>
                        updateNightHalt(
                          'enabled',
                          event.target.checked
                        )
                      }
                      color='warning'
                    />
                  }
                  label={
                    config.nightHalt.enabled
                      ? 'Enabled'
                      : 'Disabled'
                  }
                />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Grid
                container
                spacing={1.5}
              >
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='time'
                    label='Window Start Time'
                    value={
                      config.nightHalt
                        .windowStartTime
                    }
                    onChange={event =>
                      updateNightHalt(
                        'windowStartTime',
                        event.target.value
                      )
                    }
                    disabled={
                      !config.nightHalt.enabled
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={compactFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='time'
                    label='Window End Time'
                    value={
                      config.nightHalt
                        .windowEndTime
                    }
                    onChange={event =>
                      updateNightHalt(
                        'windowEndTime',
                        event.target.value
                      )
                    }
                    disabled={
                      !config.nightHalt.enabled
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={compactFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Minimum Duration (mins)'
                    value={
                      config.nightHalt
                        .minimumDurationMinutes
                    }
                    onChange={event =>
                      updateNightHalt(
                        'minimumDurationMinutes',
                        Number(
                          event.target.value
                        )
                      )
                    }
                    disabled={
                      !config.nightHalt.enabled
                    }
                    sx={compactFieldSx}
                  />
                </Grid>
              </Grid>

              <Alert
                severity='warning'
                icon={<InfoOutlined />}
                sx={{
                  mt: 1.5,
                  py: 0,
                  fontSize: 12,
                }}
              >
                A night halt is recorded when the
                vehicle remains stationary inside
                the configured window for the
                minimum duration.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* <Card
        sx={{
          ...sectionCardSx,
          mb: 1.5,
        }}
      >
        <CardContent>
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            mb={1.5}
          >
            <SettingsRounded color='warning' />

            <Typography fontWeight={700}>
              Halt Detection Parameters
            </Typography>
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='Stationary Radius (meters)'
                value={
                  config.detection
                    .stationaryRadiusMeters
                }
                onChange={event =>
                  updateDetection(
                    'stationaryRadiusMeters',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='Stationary Speed Threshold'
                value={
                  config.detection
                    .stationarySpeedThreshold
                }
                onChange={event =>
                  updateDetection(
                    'stationarySpeedThreshold',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='Stationary Confirmation Packets'
                value={
                  config.detection
                    .stationaryConfirmationPackets
                }
                onChange={event =>
                  updateDetection(
                    'stationaryConfirmationPackets',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='Movement Confirmation Packets'
                value={
                  config.detection
                    .movementConfirmationPackets
                }
                onChange={event =>
                  updateDetection(
                    'movementConfirmationPackets',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='Max Packet Gap (seconds)'
                value={
                  config.detection
                    .maxPacketGapSeconds
                }
                onChange={event =>
                  updateDetection(
                    'maxPacketGapSeconds',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type='number'
                label='GPS Jump Speed Multiplier'
                value={
                  config.detection
                    .gpsJumpSpeedMultiplier
                }
                onChange={event =>
                  updateDetection(
                    'gpsJumpSpeedMultiplier',
                    Number(event.target.value)
                  )
                }
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Alert
                severity='warning'
                icon={<InfoOutlined />}
                sx={{
                  py: 0,
                  height: 38,
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                These parameters control how the
                system detects halts from incoming
                location packets.
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card> */}

      <Card
        sx={{
          ...sectionCardSx,
          mb: 1.5,
        }}
      >
        <CardContent>
          <Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 1,
  }}
>
  <Typography
    variant='h6'
    sx={{
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    Halting Locations (Map View)
  </Typography>

  <IconButton
    size='small'
    onClick={() => setMapFullscreenOpen(true)}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      width: 34,
      height: 34,
    }}
  >
    <FullscreenIcon fontSize='small' />
  </IconButton>
</Box>

          <Box
            sx={{
              height: 380,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1.5,
            }}
          >
            <Box
              sx={{
    position: 'absolute',
    top: 70,
    left: 12,
    zIndex: 1000,
    bgcolor: 'rgba(20,20,20,0.90)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 2,
    px: 1.5,
    py: 1.5,
    minWidth: 180,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  }}
            >
              <Typography
                variant='caption'
                fontWeight={700}
              >
                Show
              </Typography>

              <Stack spacing={0}>
                <FormControlLabel
                  control={
                    <Checkbox
                     sx={{
    p: 0.4,
    color: '#9CCC65',
    '&.Mui-checked': {
      color: '#9CCC65',
    },
  }}
                      size='small'
                      color='warning'
                      checked={showDayHalt}
                      onChange={event =>
                        setShowDayHalt(
                          event.target.checked
                        )
                      }
                    />
                  }
                  label={
                    <Typography variant='caption'>
                      Day Halt Location
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                     sx={{
    p: 0.4,
    color: '#9CCC65',
    '&.Mui-checked': {
      color: '#9CCC65',
    },
  }}
                      size='small'
                      checked={showNightHalt}
                      onChange={event =>
                        setShowNightHalt(
                          event.target.checked
                        )
                      }
                    />
                  }
                  label={
                    <Typography variant='caption'>
                      Night Halt Location
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                     sx={{
    p: 0.4,
    color: '#9CCC65',
    '&.Mui-checked': {
      color: '#9CCC65',
    },
  }}
                      size='small'
                      checked={showStops}
                      onChange={event =>
                        setShowStops(
                          event.target.checked
                        )
                      }
                    />
                  }
                  label={
                    <Typography variant='caption'>
                      Normal Stops
                    </Typography>
                  }
                />
              </Stack>
            </Box>

           <Box
  sx={{
    height: '100%',
    width: '100%',
  }}
>
  {haltMap}
</Box>

<Dialog
  fullScreen
  open={mapFullscreenOpen}
  onClose={() => setMapFullscreenOpen(false)}
>
  <DialogContent
    sx={{
      p: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}
  >
    <Box
      sx={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        flexShrink: 0,
      }}
    >
      <Typography
        variant='h6'
        sx={{
          fontSize: 17,
          fontWeight: 600,
        }}
      >
        Halting Locations
      </Typography>

      <IconButton
        onClick={() =>
          setMapFullscreenOpen(false)
        }
      >
        <CloseIcon />
      </IconButton>
    </Box>

    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {haltMap}
    </Box>
  </DialogContent>
</Dialog>
          </Box>
        </CardContent>
      </Card>

      <Card
        sx={{
          ...sectionCardSx,
          mb: 1.5,
        }}
      >
        <CardContent>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            mb={1}
          >
            <Typography fontWeight={700}>
              Halting Log
            </Typography>

            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
            >
              <Typography variant='body2'>
                Total Halts: {halts.length}
              </Typography>

              <Button
                size='small'
                variant='outlined'
                startIcon={<DownloadRounded />}
                onClick={downloadCsv}
                disabled={!halts.length}
              >
                Download CSV
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              overflowX: 'auto',
            }}
          >
            <Box
              component='table'
              sx={{
                width: '100%',
                borderCollapse: 'collapse',

                '& th': {
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: 1,
                  py: 1,
                  whiteSpace: 'nowrap',
                },

                '& td': {
                  fontSize: 12,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: 1,
                  py: 1,
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Halt Type</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Location</th>
                  {/* <th>Day Duration</th>
                  <th>Night Duration</th>
                  <th>Status</th>
                  <th>Completion Reason</th> */}
                </tr>
              </thead>

              <tbody>
                {halts.map((halt, index) => {
                  const qualified =
                    halt.dayHaltQualified ||
                    halt.nightHaltQualified

                  return (
                    <tr key={halt._id}>
                      <td>{index + 1}</td>

                      <td>
                        <Chip
                          size='small'
                          variant='outlined'
                          color={
                            halt.classification ===
                            'DAY_HALT'
                              ? 'warning'
                              : halt.classification ===
                                  'NIGHT_HALT'
                                ? 'primary'
                                : 'default'
                          }
                          label={getClassificationLabel(
                            halt.classification
                          )}
                          sx={{
                            height: 22,
                            fontSize: 10,
                          }}
                        />
                      </td>

                      <td>
                        {formatDate(halt.startedAt)}
                      </td>

                      <td>
                        {formatDate(halt.endedAt)}
                      </td>

                      <td>
                        {formatDuration(
                          halt.durationSeconds
                        )}
                      </td>

                      <td>
                        {halt.anchorLocation.latitude.toFixed(
                          5
                        )}
                        ,{' '}
                        {halt.anchorLocation.longitude.toFixed(
                          5
                        )}
                      </td>

                      {/* <td>
                        {formatDuration(
                          halt.dayDurationSeconds
                        )}
                      </td>

                      <td>
                        {formatDuration(
                          halt.nightDurationSeconds
                        )}
                      </td> */}

                      {/* <td>
                        <Chip
                          size='small'
                          color={
                            qualified
                              ? 'success'
                              : 'default'
                          }
                          variant='outlined'
                          label={
                            qualified
                              ? 'QUALIFIED'
                              : 'STOP'
                          }
                          sx={{
                            height: 22,
                            fontSize: 10,
                          }}
                        />
                      </td> */}

                      {/* <td>
  {halt.completionReason
    ?.replace(/_/g, ' ')}
</td> */}
                    </tr>
                  )
                })}

                {!halts.length && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: 'center',
                        padding: 30,
                      }}
                    >
                      No halt history found for
                      this vehicle
                    </td>
                  </tr>
                )}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <Button
          variant='outlined'
          startIcon={<RestartAltRounded />}
          onClick={resetConfiguration}
        >
          Reset
        </Button>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            onClick={() =>
              selectedVehicleId &&
              loadVehicleData(
                selectedVehicleId
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant='contained'
            startIcon={
              saving ? (
                <CircularProgress
                  size={16}
                  color='inherit'
                />
              ) : (
                <SaveRounded />
              )
            }
            onClick={saveConfiguration}
            disabled={
              saving || !selectedVehicleId
            }
          >
            Save Halt 
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack('')}
      >
        <MuiAlert
          severity='success'
          variant='filled'
          onClose={() => setSnack('')}
        >
          {snack}
        </MuiAlert>
      </Snackbar>
    </Box>
  )
}

export default HaltConfiguration