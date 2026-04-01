import React, { useMemo } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'

export function DynamicDatePicker({ label, value, onChange, error, helperText, required, minDate }: any) {
  const dynamicFormat = useMemo(() => {
    const config = JSON.parse(localStorage.getItem('countryConfig') || '{}')
    return (config.dateFormat || 'YYYY-MM-DD').toUpperCase()
  }, [])

  const dateValue = useMemo(() => {
    if (!value) return null

    // --- LOCAL TIME FIX ---
    // If value is "2026-02-21T23:59:59.000Z"
    // 1. split('T')[0] gets "2026-02-21"
    // 2. By NOT using .utc(), dayjs treats this as a LOCAL date at 00:00:00
    const localDateString = typeof value === 'string' ? value.split('T')[0] : value

    return dayjs(localDateString)
  }, [value])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={`${label} (${dynamicFormat})`}
        format={dynamicFormat}
        value={dateValue}
        // Force minDate to local midnight as well
        minDate={minDate ? dayjs(String(minDate).split('T')[0]) : undefined}
        onChange={(newValue: Dayjs | null) => {
          if (newValue && newValue.isValid()) {
            const y = newValue.year()
            const m = String(newValue.month() + 1).padStart(2, '0')
            const d = String(newValue.date()).padStart(2, '0')

            // Return a clean YYYY-MM-DD string to the form
            onChange(`${y}-${m}-${d}`)
          } else {
            onChange('')
          }
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            error: error,
            helperText: helperText,
            required: required,
          },
        }}
      />
    </LocalizationProvider>
  )
}

interface DynamicEndDatePickerProps {
  label: string
  value: string
  onChange: (isoDate: string) => void
  error?: boolean
  helperText?: string
  required?: boolean
  minDate?: string // To prevent End Date < Start Date
}

export function DynamicEndDatePicker({ label, value, onChange, error, helperText, required, minDate ,disabled}: any) {
  const dynamicFormat = useMemo(() => {
    const config = JSON.parse(localStorage.getItem('countryConfig') || '{}')
    return (config.dateFormat || 'YYYY-MM-DD').toUpperCase()
  }, [])

  //   const dateValue = useMemo(() => {
  //     if (!value) return null
  //     const cleanDate = String(value).split('T')[0]
  //     return dayjs(cleanDate)
  //   }, [value])
  const dateValue = useMemo(() => {
    if (!value) return null
    const localDateString = typeof value === 'string' ? value.split('T')[0] : value
    return dayjs(localDateString)
  }, [value])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={`${label} (${dynamicFormat})`}
        format={dynamicFormat}
        value={dateValue}
        disabled={disabled}
        // minDate={minDate ? dayjs(String(minDate).split('T')[0]) : undefined}
        minDate={
    minDate 
      ? dayjs(String(minDate).split('T')[0]).add(1, 'day') 
      : undefined
  }
        onChange={(newValue: Dayjs | null) => {
          if (newValue && newValue.isValid()) {
            const y = newValue.year()
            const m = String(newValue.month() + 1).padStart(2, '0')
            const d = String(newValue.date()).padStart(2, '0')

            const finalPayload = `${y}-${m}-${d}`
            console.log(finalPayload, 'njdbcvhyh')

            onChange(finalPayload)
          } else {
            onChange('')
          }
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            error,
            helperText,
            required,
          },
        }}
      />
    </LocalizationProvider>
  )
}
