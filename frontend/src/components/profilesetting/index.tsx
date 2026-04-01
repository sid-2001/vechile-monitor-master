import { LocalStorageService } from '../../helpers/local-storage-service'
import { Box, Avatar, Typography, Menu, MenuItem, Divider, Select, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

// Array of random avatar background colors
const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F1948A', '#82E0AA', '#F5B041', '#5DADE2', '#E8DAEF'
]

const avatarStyles = [
  // 'lorelei',     // animals / creatures 🐻🦊
  'micah',       // clean professional 👔
  // 'avataaars',   // human formal 👩‍💼
  // 'bottts',      // robot creatures 🤖
]

const getAvatarUrl = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const style = avatarStyles[Math.abs(hash) % avatarStyles.length]
  return `https://api.dicebear.com/7.x/rings/svg?seed=${seed}`
}

// Function to generate consistent color based on staff ID or name
const getAvatarColor = (staffId: string) => {
  if (!staffId) return avatarColors[0]
  
  // Simple hash function to get consistent color for same staff
  let hash = 0
  for (let i = 0; i < staffId.length; i++) {
    hash = staffId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % avatarColors.length
  return avatarColors[index]
}

// Function to generate random avatar SVG URL (using DiceBear API - free and open source)
const getRandomAvatarUrl = (seed: string) => {
  // You can choose different styles: 'adventurer', 'adventurer-neutral', 'avataaars', 'bottts', 'fun-emoji', etc.
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

const getLiveAuditData = async (latitude: any, longitude: any) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`, {
      headers: { 'User-Agent': 'YourAppName/1.0' },
    })
    const locResult = await res.json()

    const ianaTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
    const isIndiaTimezone = ianaTZ.includes('Calcutta') || ianaTZ.includes('Kolkata')

    let fullLocation = 'UNKNOWN LOCATION'

    if (isIndiaTimezone && locResult.address?.country_code !== 'in') {
      fullLocation = 'GURUGRAM, HR, INDIA'
    } else if (locResult.address) {
      const addr = locResult.address
      const city = addr.city || addr.town || addr.village || addr.suburb || 'Gurugram'
      const state = addr.state || 'HR'
      const country = addr.country || 'India'
      fullLocation = `${city}, ${state}, ${country}`.toUpperCase()
    }

    const now = new Date()
    const offsetMinutes = -now.getTimezoneOffset()
    const hours = Math.floor(Math.abs(offsetMinutes) / 60)
    const mins = Math.abs(offsetMinutes) % 60
    const formattedOffset = `${offsetMinutes >= 0 ? '+' : '-'}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

    return {
      location: fullLocation,
      localDateTime: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
      utcDateTime: dayjs.utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
      timeZone: ianaTZ,
      offset: formattedOffset,
    }
  } catch (error) {
    console.error('Audit Fetch Error:', error)
    return null
  }
}

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [liveLocation, setLiveLocation] = useState<any>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [avatarSeed, setAvatarSeed] = useState<string>('')
  const [avatarError, setAvatarError] = useState(false)
  const open = Boolean(anchorEl)
  const local_service = new LocalStorageService()
  const staff = local_service?.get_staff_access()
  const navigate = useNavigate()

  // Generate avatar seed when staff data is available
  useEffect(() => {
    if (staff) {
      // Create a unique seed using staff ID and name
      const seed = `${staff.staffId}-${staff.staffFirstName}-${staff.staffLastName}`.toLowerCase().replace(/\s+/g, '')
      setAvatarSeed(seed)
    }
  }, [staff])

  // Get user's location when component mounts
  useEffect(() => {
    const getUserLocation = async () => {
      setLocationLoading(true)
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              const data = await getLiveAuditData(latitude, longitude)
              setLiveLocation(data)
              setLocationLoading(false)
            },
            (error) => {
              console.error('Error getting location:', error)
              setLocationLoading(false)
            }
          )
        } else {
          console.log('Geolocation is not supported by this browser.')
          setLocationLoading(false)
        }
      } catch (error) {
        console.error('Location fetch error:', error)
        setLocationLoading(false)
      }
    }

    getUserLocation()
  }, [])

  const updateCountryConfig = async (countryCode: string) => {
    try {
      const response = await fetch(`https://api.impronics.com/api/static-table/countryCorridorProduct/getByCountryCode/${countryCode}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()

      if (result.status && result.data && result.data.length > 0) {
        localStorage.setItem('countryConfig', JSON.stringify(result.data[0]))
      }
    } catch (error) {
      console.error('Error updating country configuration:', error)
    }
  }

  const CountrySelector = () => {
    const staff = local_service?.get_staff_access()
    if (!staff) return null

    const countryNames: Record<string, string> = {
      ZA: 'South Africa',
      IN: 'India',
      US: 'United States',
      UK: 'United Kingdom',
      AE: 'UAE',
    }

    const getFlag = (code: string) => (code ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️')

    const selectedCountry = local_service.get_staff_country()

    useEffect(() => {
      if (!selectedCountry && staff.staffCountries?.length) {
        const firstCountry = staff.staffCountries[0]
        local_service.set_usercountry(firstCountry)
        updateCountryConfig(firstCountry)
      }
    }, [staff, selectedCountry])

    return (
      <Stack id="imp-Menu_Item_Selector" direction="row" alignItems="center" spacing={0.6} sx={{ mt: '2px' }}>
        {staff.staffCountries?.length > 1 ? (
          <Select
            size="small"
            value={selectedCountry || ''}
            onChange={async (e) => {
              const newCountry = e.target.value
              await updateCountryConfig(newCountry)
              local_service.set_usercountry(newCountry)
              window.location.reload()
            }}
            sx={{
              fontSize: { xs: '11px', md: '1.4vh' },
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              '& .MuiSelect-icon': { color: 'white' },
              '& fieldset': { border: 'none' },
            }}
          >
            {staff.staffCountries.map((code: string) => (
              <MenuItem key={code} value={code}>
                <Box id={"imp-" + code} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{getFlag(code)}</span>
                  <span>{countryNames[code] || code}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        ) : (
          selectedCountry && (
            <>
              <Typography sx={{ fontSize: { xs: '12px', md: '1.5vh' } }}>{getFlag(selectedCountry)}</Typography>
              <Typography
                sx={{
                  fontSize: { xs: '12px', md: '1.5vh' },
                  color: 'white',
                  whiteSpace: 'nowrap',
                }}
              >
                {countryNames[selectedCountry] || selectedCountry}
              </Typography>
            </>
          )
        )}
      </Stack>
    )
  }

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Format the formattedDate similar to your original code
  const formattedDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Get avatar color based on staff ID
  const avatarColor = staff?.staffId ? getAvatarColor(staff.staffId) : avatarColors[0]

  return (
    <>
      <Box
        id="imp-Profile-Menu-Box"
        onClick={handleOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          px: 1.5,
          py: 0.8,
          borderRadius: '30px',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        }}
      >
    



        <Avatar
  src={getAvatarUrl(
    `${staff?.staffId}-${staff?.staffFirstName}-${staff?.staffLastName}`
  )}
  sx={{
    width: 42,
    height: 42,
    bgcolor: avatarColor,
  }}
>
  {staff?.staffFirstName?.[0]}
  {staff?.staffLastName?.[0]}
</Avatar>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
            {staff?.staffFirstName} {staff?.staffLastName}
          </Typography>
          <Typography sx={{ color: 'white', opacity: 0.7, fontSize: '12px' }}>
            {staff?.userCategory || staff?.roleDescription || 'User'}
          </Typography>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            minWidth: 280,
            borderRadius: 2,
            backgroundColor: '#1e1e2f',
            color: 'white',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
         <>

           <Avatar
           //@ts-ignore
   
  src={getAvatarUrl(
    `${staff?.staffId}-${staff?.staffFirstName}-${staff?.staffLastName}`
  )}
  sx={{
    width: 42,
    height: 42,
    bgcolor: avatarColor,
  }}
>
            {/* Fallback to initials if avatar fails to load */}
            {avatarError && (
              <>
                {staff?.staffFirstName?.[0]?.toUpperCase()}
                {staff?.staffLastName?.[0]?.toUpperCase()}
              </>
            )}
          </Avatar>
         </>
       
          <Box>
            <Typography fontWeight={600}>
              {staff?.staffFirstName} {staff?.staffLastName}
            </Typography>
            <Typography
              sx={{ cursor: 'pointer', fontSize: '13px', opacity: 0.8 }}
              onClick={() => {
                navigate(`/profile/edit/${staff?.staffId}`)
                handleClose()
              }}
            >
              User ID: {staff?.staffId}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Location Information */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: '12px', opacity: 0.6, mb: 0.5 }}>📍 Location Info</Typography>
          {locationLoading ? (
            <Typography sx={{ fontSize: '12px' }}>Loading location...</Typography>
          ) : liveLocation ? (
            <>
              <Typography sx={{ fontSize: '12px', fontWeight: 500 }}>{liveLocation.location}</Typography>
              <Typography sx={{ fontSize: '11px', opacity: 0.7, mt: 0.5 }}>
                Local: {liveLocation.localDateTime.split(' ')[1]}
                <br />
                TZ: {liveLocation.timeZone} ({liveLocation.offset})
              </Typography>
              <Typography sx={{ fontSize: '10px', opacity: 0.5, mt: 0.5 }}>System Date: {formattedDate}</Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: '12px', opacity: 0.5 }}>Location unavailable</Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <MenuItem disableRipple sx={{ cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
          <CountrySelector />
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <MenuItem
          onClick={() => {
            navigate(`/profile/edit/${staff?.staffId}`)
            handleClose()
          }}
        >
          My Profile
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <MenuItem
          onClick={() => {
            local_service.delete_eaccestoke()
            window.location.reload()
            handleClose()
          }}
          sx={{ color: '#ff6b6b' }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}

export default ProfileMenu