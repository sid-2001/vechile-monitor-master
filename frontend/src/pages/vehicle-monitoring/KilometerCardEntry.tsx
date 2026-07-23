import { useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'
// import { vehicleMonitorService } from '../../services/vehicleMonitorService'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import { LocalStorageService } from '../../helpers/local-storage-service'
import kilometerCardService, {
  KilometerCardDailyEntry,
  KilometerCardData,
} from '../../services/kilometerCard.service'

interface Vehicle {
  _id: string
  vehicleNo?: string
  vehicleNumber?: string
  registrationNumber?: string
  name?: string
  nomenclature?: string
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface JwtPayload {
  id: string
  role: 'ADMIN' | 'DRIVER' | 'OPERATOR'
}

const getAllowedMonths = (
  isAdmin: boolean,
  currentMonth: number
) => {
  if (isAdmin) {
    return months
  }

  const allowedMonthNumbers = [
    currentMonth - 2,
    currentMonth - 1,
    currentMonth,
  ].filter((month) => month >= 1)

  return months.filter((month) =>
    allowedMonthNumbers.includes(month.value)
  )
}

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate()
}

const createDailyEntries = (
  month: number,
  year: number
): KilometerCardDailyEntry[] => {
  const days = getDaysInMonth(month, year)

  return Array.from({ length: days }, (_, index) => ({
    date: index + 1,
    dailyMileageIncludingAmenity: 0,
    sr: 0,
    trg: 0,
    fuelDrawnPol: 0,
    fuelDrawnEngineOil: 0,
  }))
}

const KilometerCardEntry = () => {
  const currentDate = new Date()

  const localStorageService = new LocalStorageService()

  const token = String(
    localStorageService.get_accesstoken() || ''
  ).replace(/"/g, '')

  let userRole = ''

  try {
    const decoded = jwtDecode<JwtPayload>(token)
    userRole = decoded.role
  } catch (error) {
    console.error('Failed to decode user role', error)
  }

  const isAdmin =
    token === 'Impronics@1234' ||
    userRole === 'ADMIN'

  console.log('USER ROLE:', userRole)
  console.log('IS ADMIN:', isAdmin)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingCard, setLoadingCard] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [cardId, setCardId] = useState<string | null>(null)
  const allowedMonths = useMemo(() => {
  return getAllowedMonths(
    isAdmin,
    currentDate.getMonth() + 1
  )
}, [isAdmin])

  const [formData, setFormData] = useState<KilometerCardData>({
    vehicleId: '',
    vehicleNo: '',
    nomenclature: '',

    balanceInTank: 0,
    targetAsPerWorkshop: 0,
    targetKplAsPerAo: 0,

    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,

    dailyEntries: createDailyEntries(
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    ),

    balanceFuelInTank: 0,
    totalFuelConsumed: 0,
    totalFuelConsumedStaticEngineDuty: 0,
    totalFuelConsumedIdling: 0,
    totalKmsRun: 0,
    kplAchieved: 0,
  })

  useEffect(() => {
    const loadVehicles = async () => {
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

    loadVehicles()
  }, [])

  const selectedMonthName = useMemo(() => {
    return (
      months.find((month) => month.value === formData.month)?.label ||
      ''
    )
  }, [formData.month])

  const getVehicleNumber = (vehicle: Vehicle) => {
    return (
      vehicle.vehicleNo ||
      vehicle.vehicleNumber ||
      vehicle.registrationNumber ||
      vehicle.name ||
      ''
    )
  }

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(
      (item) => item._id === vehicleId
    )

    setCardId(null)

    setFormData((prev) => ({
      ...prev,
      vehicleId,
      vehicleNo: vehicle ? getVehicleNumber(vehicle) : '',
      nomenclature: vehicle?.nomenclature || '',
    }))
  }

  const handleMonthChange = (month: number) => {
    setCardId(null)

    setFormData((prev) => ({
      ...prev,
      month,
      dailyEntries: createDailyEntries(month, prev.year),
    }))
  }

  const handleYearChange = (year: number) => {
    setCardId(null)

    setFormData((prev) => ({
      ...prev,
      year,
      dailyEntries: createDailyEntries(prev.month, year),
    }))
  }

  const handleFieldChange = (
    field: keyof KilometerCardData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDailyEntryChange = (
    date: number,
    field: keyof KilometerCardDailyEntry,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      dailyEntries: prev.dailyEntries.map((entry) =>
        entry.date === date
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      ),
    }))
  }

  const loadExistingCard = async () => {
    if (!formData.vehicleId) {
      return
    }

    try {
      setLoadingCard(true)
      setError('')

      const response =
        await kilometerCardService.getKilometerCardByVehicleMonth(
          formData.vehicleId,
          formData.year,
          formData.month
        )

      const card = response.data

      const defaultEntries = createDailyEntries(
        formData.month,
        formData.year
      )

      const mergedEntries = defaultEntries.map((defaultEntry) => {
        const existingEntry = card.dailyEntries?.find(
          (entry: KilometerCardDailyEntry) =>
            entry.date === defaultEntry.date
        )

        return existingEntry || defaultEntry
      })

      setCardId(card._id)

      setFormData({
        ...card,
        vehicleId:
          typeof card.vehicleId === 'object'
            ? card.vehicleId._id
            : card.vehicleId,
        dailyEntries: mergedEntries,
      })

      setSuccess('Existing kilometer card loaded')
    } catch (e: any) {
      setCardId(null)

     if (
  e?.error_message
    ?.toLowerCase()
    .includes('not found')
) {
  let previousMonth = formData.month - 1
  let previousYear = formData.year

  if (previousMonth === 0) {
    previousMonth = 12
    previousYear = formData.year - 1
  }

  try {
    const previousResponse =
      await kilometerCardService.getKilometerCardByVehicleMonth(
        formData.vehicleId,
        previousYear,
        previousMonth
      )

    const previousCard = previousResponse.data

    setFormData((prev) => ({
      ...prev,
      balanceInTank:
        previousCard.balanceFuelInTank ?? 0,
    }))

    setSuccess(
      `Previous month closing balance carried forward to ${selectedMonthName}.`
    )
  } catch {
    setFormData((prev) => ({
      ...prev,
      balanceInTank: 0,
    }))

    setSuccess(
      `No existing card found for ${selectedMonthName}. You can create a new card.`
    )
  }
} else {
        setError(
          e?.error_message || 'Failed to load kilometer card'
        )
      }
    } finally {
      setLoadingCard(false)
    }
  }

  useEffect(() => {
    if (!formData.vehicleId) {
      return
    }

    loadExistingCard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.vehicleId,
    formData.month,
    formData.year,
  ])

  

  const handleDownloadReport = async () => {
  if (!formData.vehicleId) {
    setError('Please select a vehicle')
    return
  }

  try {
    setError('')

    const response = await kilometerCardService.downloadReport(
      formData.vehicleId,
      formData.year,
      formData.month
    )

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    const monthName =
      months.find(
        (item) => item.value === formData.month
      )?.label || String(formData.month)

    link.download = `Kilometer-Card-${formData.vehicleNo}-${monthName}-${formData.year}.pdf`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)

    setSuccess('Kilometer card report downloaded successfully')
  } catch (e: any) {
    setError(
      e?.error_message ||
        'Failed to download kilometer card report'
    )
  }
}


const handleDownloadHalfYearReport = async () => {
  if (!formData.vehicleId) {
    setError('Please select a vehicle')
    return
  }

  try {
    setError('')

    const response =
      await kilometerCardService.downloadHalfYearReport(
        formData.vehicleId,
        formData.year,
        formData.month
      )

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    let reportWindow = ''

    if (
      formData.month >= 4 &&
      formData.month <= 9
    ) {
      reportWindow = `April-September-${formData.year}`
    } else if (formData.month >= 10) {
      reportWindow =
        `October-${formData.year}-March-${formData.year + 1}`
    } else {
      reportWindow =
        `October-${formData.year - 1}-March-${formData.year}`
    }

    link.download =
      `Kilometer-Card-${formData.vehicleNo}-${reportWindow}.pdf`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)

    setSuccess(
      'Six month kilometer card downloaded successfully'
    )
  } catch (e: any) {
    setError(
      e?.error_message ||
        'Failed to download six month kilometer card'
    )
  }
}


  const handleSave = async () => {
    if (!formData.vehicleId) {
      setError('Please select a vehicle')
      return
    }

    if (!formData.vehicleNo.trim()) {
      setError('Vehicle number is required')
      return
    }

    if (!formData.nomenclature.trim()) {
      setError('Nomenclature is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (cardId) {
        const response =
          await kilometerCardService.updateKilometerCard(
            cardId,
            formData
          )

        setFormData((prev) => ({
          ...prev,
          ...response.data,
          vehicleId: prev.vehicleId,
        }))

        setSuccess('Kilometer card updated successfully')
      } else {
        const response =
          await kilometerCardService.createKilometerCard(
            formData
          )

        setCardId(response.data._id)

        setSuccess('Kilometer card created successfully')
      }
    } catch (e: any) {
      setError(
        e?.error_message || 'Failed to save kilometer card'
      )
    } finally {
      setSaving(false)
    }
  }

 return (
  <Box
    sx={{
      p: 1.5,

      '& .MuiInputBase-root': {
        minHeight: 34,
        fontSize: '0.82rem',
      },

      '& .MuiInputBase-input': {
        py: 0.7,
        px: 1.2,
      },

      '& .MuiInputLabel-root': {
        fontSize: '0.82rem',
      },

      '& .MuiSelect-select': {
        py: '7px !important',
        fontSize: '0.82rem',
      },

      '& .MuiFormControl-root': {
        minHeight: 34,
      },
    }}
  >
    <Stack spacing={1.5}>
        <Box>
         <Typography
  variant="h5"
  fontWeight={700}
  sx={{ fontSize: '1.45rem' }}
>
  Kilometer Card Entry
</Typography>

          <Typography
            variant="body2"
            color="text.secondary"
           sx={{ mt: 0.2, fontSize: '0.78rem' }}
          >
            Enter monthly vehicle kilometer and fuel details
          </Typography>
        </Box>

        <Card>
         <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Typography
  variant="subtitle1"
  fontWeight={700}
  sx={{ mb: 1, fontSize: '1rem' }}
>
              Report Selection
            </Typography>

           <Grid container spacing={1}>
            <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle</InputLabel>

                  <Select
                    value={formData.vehicleId}
                    label="Vehicle"
                    disabled={loadingVehicles}
                    onChange={(e) =>
                      handleVehicleChange(e.target.value)
                    }
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem
                        key={vehicle._id}
                        value={vehicle._id}
                      >
                        {getVehicleNumber(vehicle)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>

                  <Select
                    value={formData.month}
                    label="Month"
                    onChange={(e) =>
                      handleMonthChange(Number(e.target.value))
                    }
                  >
                    {months.map((month) => (
                      <MenuItem
                        key={month.value}
                        value={month.value}
                      >
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

             <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    handleYearChange(Number(e.target.value))
                  }
                />
              </Grid>
            </Grid>

            {loadingCard && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Typography
  variant="subtitle1"
  fontWeight={700}
  sx={{ mb: 1, fontSize: '1rem' }}
>
              Vehicle / Card Details
            </Typography>

            <Grid container spacing={1}>
             <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  label="Vehicle No"
                  value={formData.vehicleNo}
                  onChange={(e) =>
                    handleFieldChange(
                      'vehicleNo',
                      e.target.value
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  label="Nomenclature"
                  value={formData.nomenclature}
                  onChange={(e) =>
                    handleFieldChange(
                      'nomenclature',
                      e.target.value
                    )
                  }
                />
              </Grid>

             <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Balance in Tank"
                  value={formData.balanceInTank}
                  onChange={(e) =>
                    handleFieldChange(
                      'balanceInTank',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Target as per Workshop"
                  value={formData.targetAsPerWorkshop}
                  onChange={(e) =>
                    handleFieldChange(
                      'targetAsPerWorkshop',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Target KPL as per AO"
                  value={formData.targetKplAsPerAo}
                  onChange={(e) =>
                    handleFieldChange(
                      'targetKplAsPerAo',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Typography
  variant="subtitle1"
  fontWeight={700}
  sx={{ mb: 1, fontSize: '1rem' }}
>
              {selectedMonthName} {formData.year} Daily Entries
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Enter date-wise mileage and fuel drawn details
            </Typography>

            <TableContainer
              component={Paper}
              variant="outlined"
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Date
                    </TableCell>

                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        minWidth: 230,
                      }}
                    >
                      Duty Including Amenity
                    </TableCell>

                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      SR
                    </TableCell>

                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      TRG
                    </TableCell>

                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Fuel Drawn
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      POL
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      ENG. OIL
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {formData.dailyEntries.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell align="center">
                        {entry.date}
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={
                            entry.dailyMileageIncludingAmenity
                          }
                          onChange={(e) =>
                            handleDailyEntryChange(
                              entry.date,
                              'dailyMileageIncludingAmenity',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={entry.sr}
                          onChange={(e) =>
                            handleDailyEntryChange(
                              entry.date,
                              'sr',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={entry.trg}
                          onChange={(e) =>
                            handleDailyEntryChange(
                              entry.date,
                              'trg',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={entry.fuelDrawnPol}
                          onChange={(e) =>
                            handleDailyEntryChange(
                              entry.date,
                              'fuelDrawnPol',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={entry.fuelDrawnEngineOil}
                          onChange={(e) =>
                            handleDailyEntryChange(
                              entry.date,
                              'fuelDrawnEngineOil',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Typography
  variant="subtitle1"
  fontWeight={700}
  sx={{ mb: 1, fontSize: '1rem' }}
>
              Monthly Summary
            </Typography>

           <Grid container spacing={1}>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Balance Fuel in Tank on last day of month"
                  value={formData.balanceFuelInTank}
                  onChange={(e) =>
                    handleFieldChange(
                      'balanceFuelInTank',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

             <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Fuel Consumed"
                  value={formData.totalFuelConsumed}
                  onChange={(e) =>
                    handleFieldChange(
                      'totalFuelConsumed',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fuel Consumed for Static Running"
                  value={
                    formData.totalFuelConsumedStaticEngineDuty
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      'totalFuelConsumedStaticEngineDuty',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fuel Consumed for duty and trg"
                  value={formData.totalFuelConsumedIdling}
                  onChange={(e) =>
                    handleFieldChange(
                      'totalFuelConsumedIdling',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total KMs Run"
                  value={formData.totalKmsRun}
                  onChange={(e) =>
                    handleFieldChange(
                      'totalKmsRun',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="KPL Achieved"
                  value={formData.kplAchieved}
                  onChange={(e) =>
                    handleFieldChange(
                      'kplAchieved',
                      Number(e.target.value)
                    )
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
  variant="outlined"
  startIcon={<DownloadIcon />}
  onClick={handleDownloadReport}
  disabled={!formData.vehicleId || loadingCard}
  sx={{
    borderColor: '#FFDE42',
    color: '#FFDE42',
    minHeight: 34,
    fontSize: '0.78rem',
    textTransform: 'none',

    '&:hover': {
      borderColor: '#FFDE42',
      backgroundColor: 'rgba(255, 222, 66, 0.08)',
    },
  }}
>
  Download Report
</Button>
<Button
  variant="outlined"
  startIcon={<DownloadIcon />}
  onClick={handleDownloadHalfYearReport}
  disabled={!formData.vehicleId || loadingCard}
  sx={{
    borderColor: '#FFDE42',
    color: '#FFDE42',
    minHeight: 34,
    fontSize: '0.78rem',
    textTransform: 'none',
    ml: 1,

    '&:hover': {
      borderColor: '#FFDE42',
      backgroundColor:
        'rgba(255, 222, 66, 0.08)',
    },
  }}
>
  Download 6 Month Card
</Button>
          <Button
            variant="contained"
            size="large"
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SaveIcon />
              )
            }
            disabled={saving || loadingCard}
            onClick={handleSave}
          >
            {cardId
              ? 'Update Kilometer Card'
              : 'Save Kilometer Card'}
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError('')}
      >
        <Alert
          severity="error"
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default KilometerCardEntry