import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    console.log("connecting")
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : String(forwardedFor || req.socket.remoteAddress || "").split(",")[0];

    res.json(await authService.login(req.body.username, req.body.password, req.body.deviceInfo, {
      ipAddress,
      userAgent: req.headers["user-agent"],
    }));
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
