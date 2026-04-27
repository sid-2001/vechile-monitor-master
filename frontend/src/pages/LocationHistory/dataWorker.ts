type VectorPoint = {
  _id: string
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  angle: number
  direction: string
  time: string
}

type EventPoint = {
  _id: string
  latitude: number
  longitude: number
  speed: number
  time: string
  type: 'overspeed' | 'harsh-braking'
}

const normalizeAngle = (angle: number) => {
  const value = Number.isFinite(angle) ? angle : 0
  return ((value % 360) + 360) % 360
}

const directionEndpoint = (lat: number, lng: number, angle: number, distanceMeters: number) => {
  const earthRadius = 6378137
  const bearing = (normalizeAngle(angle) * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180

  const nextLat = Math.asin(
    Math.sin(latRad) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(latRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(bearing)
  )

  const nextLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMeters / earthRadius) * Math.cos(latRad),
      Math.cos(distanceMeters / earthRadius) - Math.sin(latRad) * Math.sin(nextLat)
    )

  return [(nextLat * 180) / Math.PI, (nextLng * 180) / Math.PI] as [number, number]
}

self.onmessage = (e) => {
  const { type, points, overSpeed, harshBraking, zoom } = e.data as {
    type: string
    points: VectorPoint[]
    overSpeed: EventPoint[]
    harshBraking: EventPoint[]
    zoom: number
  }

  if (type !== 'optimizeHistory') return

  const gridPrecision = zoom <= 8 ? 2 : zoom <= 11 ? 3 : zoom <= 14 ? 4 : 5
  const step = zoom <= 8 ? 15 : zoom <= 11 ? 8 : zoom <= 14 ? 3 : 1
  const directionStep = zoom <= 8 ? 40 : zoom <= 11 ? 20 : zoom <= 14 ? 10 : 4

  const seen = new Set<string>()
  const sampledPoints: VectorPoint[] = []
  for (let i = 0; i < points.length; i += step) {
    const item = points[i]
    if (!item) continue
    const key = `${item.vehicleId}:${item.latitude.toFixed(gridPrecision)}:${item.longitude.toFixed(gridPrecision)}`
    if (seen.has(key)) continue
    seen.add(key)
    sampledPoints.push(item)
  }

  const directionVectors = sampledPoints
    .filter((_, index) => index % directionStep === 0)
    .map((item) => ({
      _id: item._id,
      from: [item.latitude, item.longitude] as [number, number],
      to: directionEndpoint(item.latitude, item.longitude, item.angle || 0, zoom >= 14 ? 20 : 35),
      vehicleId: item.vehicleId,
      angle: item.angle || 0,
      direction: item.direction,
      speed: item.speed,
      time: item.time,
    }))

  const eventCap = zoom <= 8 ? 200 : zoom <= 11 ? 400 : 800

  self.postMessage({
    type: 'optimizedHistory',
    data: {
      points: sampledPoints,
      directionVectors,
      overSpeed: (overSpeed || []).slice(0, eventCap),
      harshBraking: (harshBraking || []).slice(0, eventCap),
      rawCount: points.length,
      sampledCount: sampledPoints.length,
    },
  })
}
