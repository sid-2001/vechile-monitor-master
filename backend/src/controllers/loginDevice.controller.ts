import { Request, Response } from "express";
import { LoginDeviceSession } from "../models/LoginDeviceSession";

export class LoginDeviceController {
  async list(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.active !== "false";
    const filter: Record<string, unknown> = activeOnly ? { active: true } : {};
    const items = await LoginDeviceSession.find(filter)
      .populate("userId", "name username role")
      .sort({ lastLoginTime: -1 })
      .lean();
    res.json({ items, total: items.length });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const session = await LoginDeviceSession.findByIdAndUpdate(
      req.params.id,
      { active: false, loggedOutAt: new Date(), logoutReason: "admin" },
      { new: true }
    );
    if (!session) {
      res.status(404).json({ message: "Login device not found" });
      return;
    }
    res.json({ message: "Device logged out", session });
  }

  async logoutAll(_req: Request, res: Response): Promise<void> {
    const result = await LoginDeviceSession.updateMany(
      { active: true },
      { active: false, loggedOutAt: new Date(), logoutReason: "all" }
    );
    res.json({ message: "All devices logged out", modifiedCount: result.modifiedCount });
  }
}

export const loginDeviceController = new LoginDeviceController();
