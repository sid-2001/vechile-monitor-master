
class LocalStorageService {
  constructor() {}

  get(key: string) {
    return localStorage.getItem(key)
  }

  delete_eaccestoke() {
    localStorage.removeItem('access_token')
  }
  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  get_accesstoken() {
    return this.get('access_token')
  }
  get_role() {
    return this.get('role')
  }
  set_role(role: string) {
    return this.set('role', role)
  }
  set_accesstoken(access_token: string) {
    return this.set('access_token', access_token)
  }
  set_user(admin: any) {
    return this.set('user', admin)
  }

  get_staff_access() {
    let staff_record: any = this.get('user')
    
    return JSON.parse(staff_record)
  }

  get_staff_id() {
    let staff_record: any = this.get('user')
    return JSON.parse(staff_record)?._id;
  }
  
  get_staff_country() {
//@ts-ignore
      let staff_record: any = this.get('userCountry')?.replace(/^"|"$/g, "");
    return staff_record;

    // let staff_record: any = this.get('staff_access')

    
    // return JSON.parse(staff_record)?.staffCountry
  }

  set_usercountry(user_country:any) {
    let modules_record: any = this.set('userCountry',user_country);
    return (modules_record)
  }

  get_modules() {
    let modules_record: any = this.get('modules')
    return JSON.parse(modules_record)
  }

  get_validations() {
    let validations_record: any = this.get('validations')
    return JSON.parse(validations_record)
  }

  set_staff_access(staff_data: any) {


      //  this.set_usercountry(JSON.parse(staff_data)?.staffCountry);
       this.set('userCountry',(staff_data)?.staffCountry);

       if(staff_data?.staffCountries?.length>1){
        this.set('userCountry',(staff_data)?.staffCountries[0]);
       }

       console.log("i m in the data")
      //  console.log("setting data",(staff_data)?.staffCountry)
    // return JSON.parse(staff_record)?.staffCountry
    return this.set('staff_access', staff_data)
  }

  get_user(): any | null {
    let admin = this.get('user')
    let admin_parsed: any | null = null
    if (admin != undefined) {
      admin_parsed = JSON.parse(admin)
    }
    return admin_parsed
  }
  set_resetpasswordtoken(accessToken: string) {
    this.set('reset_password_token', accessToken)
  }

  get_resetpasswordtoken() {
    return this.get('reset_password_token')
  }
  get_userCurrency(){

    return this.get("userCurrencyState")
  }
}

export { LocalStorageService }
