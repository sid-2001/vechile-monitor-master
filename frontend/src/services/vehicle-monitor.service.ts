import api1 from './apis/api1'

export interface ApiListResponse<T> { items: T[]; total?: number; page?: number; limit?: number }

export const vehicleMonitorService = {
  login: (payload: { username: string; password: string }) => api1.post('/auth/login', payload),
  getUsers: () => api1.get('/users'),
  createUser: (payload: Record<string, unknown>) => api1.post('/users', payload),
  getBases: () => api1.get('/bases'),
  createBase: (payload: Record<string, unknown>) => api1.post('/bases', payload),
  getVehicles: () => api1.get('/vehicles'),
  createVehicle: (payload: Record<string, unknown>) => api1.post('/vehicles', payload),
  getDevices: (status?: string) => api1.get(`/devices${status ? `?status=${status}` : ''}`),
  createDevice: (payload: Record<string, unknown>) => api1.post('/devices', payload),
  linkDevice: (deviceId: string, vehicleId: string | null) => api1.put(`/devices/${deviceId}/link`, { vehicleId }),
  getVehicleLocations: (params?: Record<string, unknown>) => {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))
    return api1.get(`/vehicle-locations${query.toString() ? `?${query.toString()}` : ''}`)
  }
}
