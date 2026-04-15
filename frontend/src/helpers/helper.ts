import moment from 'moment-timezone';
import { LocalStorageService } from './local-storage-service';
import dayjs from 'dayjs'; 

export class HelperService {
  local_service = new LocalStorageService()
  roundToTwoFixed(num: any) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  convertDateAndTime(date: any) {
    return moment(date).tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
  }

  checkUserHasPermission(module: string, permission: string) {
    const permission_granted = this.local_service.get_staff_access()?.modules.find((item:any) => item.moduleName === module);
    return permission_granted?.access[permission] ? true : false;
  }
   formatTableDate = (dateString: string) => {
    if (!dateString) return ''
    const storedConfig = localStorage.getItem('countryConfig')
    let format = 'YYYY-MM-DD'

    if (storedConfig) {
      const config = JSON.parse(storedConfig)
      format = config.dateFormat.replace(/d/g, 'D').replace(/y/g, 'Y')
    }
    return dayjs(dateString).format(format.toUpperCase())
  }


}


