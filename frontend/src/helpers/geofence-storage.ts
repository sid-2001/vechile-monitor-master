export type GeofenceShape = 'polygon' | 'circle'

export type GeofenceArea = {
  id: string
  name: string
  shape: GeofenceShape
  points?: [number, number][]
  center?: [number, number]
  radius?: number
  createdAt: string
}

const STORAGE_KEY = 'vehicle_monitor_geofences'

export const geofenceStorage = {
  getAll(): GeofenceArea[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Unable to parse geofence data', error)
      return []
    }
  },

  saveAll(items: GeofenceArea[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  },

  add(item: GeofenceArea) {
    const current = this.getAll()
    this.saveAll([item, ...current])
  },

  remove(id: string) {
    const current = this.getAll().filter(item => item.id !== id)
    this.saveAll(current)
  }
}
