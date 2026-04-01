import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export const getLiveAuditData = async (latitude: any, longitude: any) => {
  try {
    // Using OpenStreetMap Nominatim (Open Source)
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`, {
      headers: { 'User-Agent': 'YourAppName/1.0' }, // Nominatim requires a User-Agent
    })
    const locResult = await res.json()

    const ianaTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
    const isIndiaTimezone = ianaTZ.includes('Calcutta') || ianaTZ.includes('Kolkata')

    let fullLocation = 'UNKNOWN LOCATION'

    // Open Source Logic: Priority check for Gurugram
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
export const formattedDate: any = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
