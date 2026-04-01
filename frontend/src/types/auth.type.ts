export interface Loginreq {
  email: string
  password: string
}

export interface BaseResponse {
  success: boolean
  message: string
}
export interface LoginResponse {
  success: boolean
  token: string
  admin: Admin
  role: string
}

export interface Admin {
  adminBranch: string
  _id: string
  adminName: string
  adminEmail: string
  adminPassword: string
  adminRole: string
  adminPhone: string
  adminAddress: string
  adminId: string
  createdAt: string
  updatedAt: string
  __v: number
  adminOtp: string
}

export interface User {
  email: string
  user_id: string
  role: string
}

export interface CustomerResponse {
  success: boolean
  customer: Customer
}

export interface Customer {
  residentialAddress: Address
  postalAddress: Address
  citizenshipDetails: CitizenshipDetails
  salaryDetails: SalaryDetails
  _id: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  password: string
  gender: string
  enableTwoFactor: boolean
  currency: string
  balance: number
  profileImage: string | null
  country: string
  transactions: any[] // Replace `any[]` with a more specific type if known
  dateOfBirth: string // ISO date string
  kycVerified: boolean
  role: string
  addressVerified: boolean
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  __v: number
  phone: string
  token: string
}

export interface StaffResponse {
  success: boolean
  staff: Staff
}

export interface Staff {
  staffId: string,
  staffFirstName: string,
  staffLastName: string,
  staffCountry: string,
  staffContactNumber: string,
  staffIdType: string,
  staffIdNumber: string,
  staffAddressLine1: string,
  staffAddressLine2: string,
  staffSuburb: string,
  staffCity: string,
  staffPostalCode: string,
  staffBranch: string,
  email: string,
  username: string,
  password: string,
  roleId: number,
  roleDescription: string,
  modules: [
    {
      moduleId: number,
      moduleDescription: string,
      moduleName:string
      moduleLink:string
      access: {
        canCreate: boolean,
        canRead: boolean,
        canUpdate: boolean,
        canDelete: boolean,
        accessId: null
      }
    }]
}

export interface Address {
  address1: string
  address2: string
  city: string
  state: string
  country: string
  zipCode: string
}

export interface CitizenshipDetails {
  birthCountry: string
  residenceCountry: string
  citizenship: string
  passportNo: string
}

export interface SalaryDetails {
  monthlySalary: string // Consider parsing this to a number if needed
  isSalaryAgree: boolean
}
