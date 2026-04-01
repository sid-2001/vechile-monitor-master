/* eslint-disable no-useless-catch */
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosRequestHeaders, AxiosProgressEvent } from 'axios'
import { redirect } from 'react-router-dom'
import { LocalStorageService } from '../../helpers/local-storage-service'
import { BaseError } from '../../types/error.type'
import { logger } from '../../helpers/logger'
import { publicIpv4 } from 'public-ip';

const { VITE_APP_BACKEND } = import.meta.env

interface AdaptAxiosRequestConfig extends AxiosRequestConfig {
  headers: AxiosRequestHeaders
}

const BaseUrl = VITE_APP_BACKEND

const baseUrl = BaseUrl

const instance: AxiosInstance = axios.create({
  baseURL: baseUrl,
  responseType: 'json',
})

// Fetch device info with fallback
export async function getDeviceInfo(): Promise<{ ip: string; deviceName: string }> {
  let ip = 'unknown'
  try {
    ip = await publicIpv4() || 'unknown';
  } catch (err) {
    console.warn('Failed to fetch public IP:', err)
  }

  // Get device name (OS + browser info)
  const deviceName = `${navigator.platform} - ${navigator.userAgent}`;

  return { ip, deviceName }
}
instance.interceptors.request.use(
  async (config: AdaptAxiosRequestConfig) => {
    const localStorageService = new LocalStorageService()
    const { ip, deviceName } = await getDeviceInfo()
    const token = (localStorageService.get_accesstoken() as any)?.replaceAll(`"`, '')

    const now = new Date();

    // 1. Standard Offset (e.g., +05:30)
    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
    const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
    const offset = `${sign}${hours}:${minutes}`;

    // 2. Standard Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // 3. Local DateTime with HH:mm:ss.SSS
    // Subtracting timezoneOffset ensures the ISO string reflects the user's LOCAL time
    const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .replace('Z', ''); // Result: "2026-03-09T12:45:00.783"

    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
      config.headers['ngrok-skip-browser-warning'] = 'true';
      
      // Audit Headers
      config.headers["timezone"] = timezone;
      config.headers["offset"] = offset;
      config.headers["localdatetime"] = localDateTime; 

      config.headers['X-Device-IP'] = ip;
      config.headers['X-Device-Name'] = deviceName;
    }
    
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
)
// instance.interceptors.request.use(
//   async (config: AdaptAxiosRequestConfig) => {
//     const localStorageService = new LocalStorageService()
//     const { ip, deviceName } = await getDeviceInfo()
//     const token = (localStorageService.get_accesstoken() as any)?.replaceAll(`"`, '')
//  const now = new Date();

//   // Timezone offset in minutes → convert to ±HH:MM
//   const offsetMinutes = -now.getTimezoneOffset();
//   const sign = offsetMinutes >= 0 ? "+" : "-";
//   const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
//   const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
//   const offset = `${sign}${hours}:${minutes}`;
// const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;



//   const localDateTime = now.toISOString().slice(0, 19);
//     if (token) {
//       config.headers['Authorization'] = 'Bearer ' + token
//       config.headers['ngrok-skip-browser-warning'] = '69420'
//       // "ngrok-skip-browser-warning": true;
//       config.headers['access-control-allow-credentials'] = 'true'
//       config.headers['access-control-allow-origin'] = '*'
//       config.headers['ngrok-skip-browser-warning'] = 'true'
//       config.headers['X-Device-IP'] = ip
//       config.headers['X-Device-Name'] = deviceName
//    config.headers["timezone"] = timezone;
//   config.headers["offset"] = offset;
//   config.headers["localdatetime"] = localDateTime; 
//     }
//     return config
//   },
//   (error: any) => {
//     // Handle request error
//     logger.error('Request Interceptor Error:', error)
//     return Promise.reject(error)
//   },
// )

// Response interceptor
instance.interceptors.response.use(
  async (response: AxiosResponse) => {
    if (response.status == 401) {
      const newToken = await refreshToken()
      window.location.reload()
    }
    if (response.status == 403) {
    }
    return response
  },
  async (error) => {
    console.log(error.status)

    if (error.status === 401) {
      try {
        const newToken = await refreshToken()
        error.config.headers['Authorization'] = 'Bearer ' + newToken
        return instance.request(error.config) // Retry the original request
      } catch (refreshError) {
        localStorage.clear()
        window.location.replace('/login')
        return Promise.reject(refreshError)
      }
    } else {
      const err = new BaseError()
      err.error_message = error?.response?.data || 'Bad Response'
      err.error_code = String(error.response.status)
      logger.error('Response Interceptor Error:', err)
      return Promise.reject(err)
    }
  },
)

const refreshToken = async () => {
  try {
    let local_service = new LocalStorageService()
    const response = await axios.get(`${BaseUrl}/auth/refresh-token`, {
      headers: {
        Authorization: 'Bearer ' + local_service.get_accesstoken(),
      },
    })

    const newAccessToken = response.data as any

    local_service.set_accesstoken(newAccessToken) // update token in storage
    return newAccessToken
  } catch (error) {
    redirect('/')
    return Promise.reject(error)
  }
}

const init = () => {
  // instance.defaults.headers['Cache-Control'] = 'no-cache'
  // // Access-Control-Allow-Origin: *,
  // instance.defaults.headers['Access-Control-Allow-Origin'] = '*'
  // instance.defaults.headers['ngrok-skip-browser-warning']="f434"
  // instance.defaults.withCredentials = true;
}

const get = async (url: string) => {
  try {
    const { data } = await instance.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

const post = async (url: string, object: any) => {
  try {
    const response = await instance.post(url, object, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return data
  } catch (error) {
    throw error
  }
}

const put = async (url: string, object: any) => {
  try {
    const response = await instance.put(url, object)
    return response.data
  } catch (error) {
    throw error
  }
}
//
const patch = async (url: string, object: any) => {
  try {
    console.log("i hav alld data1",url,object)

    const { data } = await instance.patch(url, object)
    console.log("i hav alld data",url,object)
    return data
  } catch (error) {
    throw error
  }
}



const del = async (url: string, object?: any) => {
  try {
    const { data } = await instance.delete(url, {
      data: object, // 👈 body goes here
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return data
  } catch (error) {
    throw error
  }
}

// const del = async (url: string, object: any) => {
//   try {
//  const data = await instance.delete(url, object, {
//       headers: {
//         'Content-Type': 'application/json',
//       }});


//       return data

//   } catch (error) {
//     throw error
//   }
// }

const upload = async (url: string, formData: any, onUploadProgress: (progressEvent: AxiosProgressEvent) => void) => {
  try {
    const { data } = await instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
    return data
  } catch (error) {
    throw error
  }
}

const api1 = {
  baseUrl,
  instance,
  init,
  get,
  post,
  put,
  del,
  upload,
  patch,
}

export default api1
