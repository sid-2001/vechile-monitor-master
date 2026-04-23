import api1 from './apis/api1'

export interface ApiListResponse<T> { items: T[]; total?: number; page?: number; limit?: number }
export interface GeofencePayload {
  name: string
  baseId: string
  center: { latitude: number; longitude: number }
  radius: number
}

export const vehicleMonitorService = {
  login: (payload: { username: string; password: string }) => api1.post('/auth/login', payload),
  getUsers: () => api1.get('/users'),
  createUser: (payload: Record<string, unknown>) => api1.post('/users', payload),
  updateUser: (id: string, payload: Record<string, unknown>) => api1.put(`/users/${id}`, payload),
  deleteUser: (id: string) => api1.del(`/users/${id}`),
  getBases: () => api1.get('/bases'),
  createBase: (payload: Record<string, unknown>) => api1.post('/bases', payload),
  getVehicles: () => api1.get('/vehicles'),
  createVehicle: (payload: Record<string, unknown>) => api1.post('/vehicles', payload),
  updateVehicle: (id: string, payload: Record<string, unknown>) => api1.put(`/vehicles/${id}`, payload),
  deleteVehicle: (id: string) => api1.del(`/vehicles/${id}`),
  getDevices: (status?: string) => api1.get(`/devices${status ? `?status=${status}` : ''}`),
  createDevice: (payload: Record<string, unknown>) => api1.post('/devices', payload),
  updateDevice: (id: string, payload: Record<string, unknown>) => api1.put(`/devices/${id}`, payload),
  deleteDevice: (id: string) => api1.del(`/devices/${id}`),
  linkDevice: (deviceId: string, vehicleId: string | null) => api1.put(`/devices/${deviceId}/link`, { vehicleId }),
  getSims: () => api1.get('/sims'),
  //simMaster Module
  createSim: (payload: Record<string, unknown>) =>api1.post('/sims', payload),
  updateSim: (id: string, payload: Record<string, unknown>) =>api1.put(`/sims/${id}`, payload),
  deleteSim: (id: string) =>api1.del(`/sims/${id}`),
  //DeviceSim Mapping
  getDeviceSimMappings: (): Promise<any> => api1.get('/device-sim-mapping'),
  createDeviceSimMapping: (payload: Record<string, unknown>) =>api1.post('/device-sim-mapping', payload),
  deleteDeviceSimMapping: (id: string) =>api1.del(`/device-sim-mapping/${id}`),
  
  createVehicleLocation: (payload: Record<string, unknown>) => api1.post('/vehicle-locations', payload),
  getVehicleLocations: (params?: Record<string, unknown>) => {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))
    return api1.get(`/vehicle-locations${query.toString() ? `?${query.toString()}` : ''}`)
  },
  // getVehicleAnalytics: (vehicleId: string) => api1.get(`/vehicle-locations/analytics/${vehicleId}`),
  getVehicleAnalytics: (
  vehicleId: string,
  params?: { from?: string; to?: string }
) => {
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );

  return api1.get(
    `/vehicle-locations/analytics/${vehicleId}${
      query.toString() ? `?${query.toString()}` : ""
    }`
  );
},
  getVehicleTimeline: (params?: Record<string, unknown>) => {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))
    return api1.get(`/vehicle-locations/timeline${query.toString() ? `?${query.toString()}` : ""}`)
  },
  getGeofences: (params?: Record<string, unknown>) => {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))
    return api1.get(`/geofences${query.toString() ? `?${query.toString()}` : ''}`)
  },
  createGeofence: (payload: GeofencePayload) => api1.post('/geofences', payload),
  updateGeofence: (id: string, payload: Partial<GeofencePayload>) => api1.put(`/geofences/${id}`, payload),
  deleteGeofence: (id: string) => api1.del(`/geofences/${id}`)

}
