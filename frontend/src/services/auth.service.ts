import { BaseService } from './base.service'
import api1 from './apis/api1'

class AuthService extends BaseService {
  async login(payload: { username: string; password: string; deviceInfo?: Record<string, unknown> }): Promise<{ token: string; user?: unknown }> {
    console.log("i m here in this only")
    return api1.post('/auth/login', payload)
  }
}

export { AuthService }
