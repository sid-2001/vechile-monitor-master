import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    res.json(await authService.login(req.body.username, req.body.password));
  }
  async generatePasscode(req: Request, res: Response): Promise<void> {
    res.json(await authService.generatePasscode(req.body.username, req.user?.username || "SYSTEM"));
  }
  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.username, req.body.passcode, req.body.newPassword);
    res.json({ message: "Password reset successful" });
  }
}

export const authController = new AuthController();
