import dayjs from 'dayjs'

export const formatTableDate = (dateString: string) => {
  if (!dateString) return ''
  const storedConfig = localStorage.getItem('countryConfig')
  let format = 'YYYY-MM-DD'

  if (storedConfig) {
    const config = JSON.parse(storedConfig)
    format = config.dateFormat.replace(/d/g, 'D').replace(/y/g, 'Y')
  }
  return dayjs(dateString).format(format.toUpperCase())
}
