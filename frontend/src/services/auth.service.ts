import { BaseService } from './base.service'
import api1 from './apis/api1'
import { BaseResponse, CustomerResponse, LoginResponse, Loginreq, StaffResponse } from '@/types/auth.type'

import { LocalStorageService } from '../helpers/local-storage-service'
import axios, { AxiosResponse } from 'axios'

import { AxiosInstance } from 'axios'
import { BaseError } from '../types/error.type'

let local_service = new LocalStorageService()

class AuthService extends BaseService {


  async login(payload: { username: String; password: String }): Promise<CustomerResponse> {
    let url = '/api/kyc/auth/login'
    try {
      let { data } = await api1.post(url, payload)
      return data
    } catch (err) {
      throw new Error("Can't Verify your Identiy")
    }
  }



}

export { AuthService }
