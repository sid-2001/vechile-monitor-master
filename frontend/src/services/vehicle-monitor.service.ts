import api1 from './apis/api1'

export interface ApiListResponse<T> { items: T[]; total: number; page: number; limit: number }

export const vehicleMonitorService = {
  login: (payload: { username: string; password: string }) => api1.post('/auth/login', payload),
  getUsers: () => api1.get('/users'),
  createUser: (payload: Record<string, unknown>) => api1.post('/users', payload),
  getBases: () => api1.get('/bases'),
  createBase: (payload: Record<string, unknown>) => api1.post('/bases', payload),
  getVehicles: () => api1.get('/vehicles'),
  createVehicle: (payload: Record<string, unknown>) => api1.post('/vehicles', payload)
}
