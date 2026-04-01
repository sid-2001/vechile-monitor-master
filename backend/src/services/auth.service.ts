import { userService } from "./user.service";

export class AuthService {
  login(username: string, password: string) {
  
    return userService.login(username, password);
  }

  generatePasscode(username: string, actor: string) {
    return userService.generatePasscode(username, actor);
  }

  resetPassword(username: string, passcode: string, newPassword: string) {
    return userService.resetPassword(username, passcode, newPassword);
  }
}

export const authService = new AuthService();
