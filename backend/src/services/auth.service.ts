import { userService } from "./user.service";

export class AuthService {
  login(username: string, password: string, deviceInfo?: any, requestMeta?: any) {
  
    return userService.login(username, password, deviceInfo, requestMeta);
  }

  generatePasscode(username: string, actor: string) {
    return userService.generatePasscode(username, actor);
  }

  resetPassword(username: string, passcode: string, newPassword: string) {
    return userService.resetPassword(username, passcode, newPassword);
  }
}

export const authService = new AuthService();
