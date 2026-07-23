import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { LoginDeviceSession } from "../models/LoginDeviceSession";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = auth.split(" ")[1];

  // ✅ Allow static token
  if (token === "Impronics@1234") {
    req.user = {
      id: "ADMIN-SCRIPT",
      role: "ADMIN", // or whatever default role you want
    } as Express.UserPayload;

    return next();
  }

  // ✅ Otherwise validate JWT
  try {
    req.user = jwt.verify(token, env.jwtSecret) as Express.UserPayload;
    if (req.user.tokenId) {
      const session = await LoginDeviceSession.findOneAndUpdate(
        { tokenId: req.user.tokenId, active: true },
        { lastSeenAt: new Date() },
        { new: true }
      );
      if (!session) {
        res.status(401).json({ message: "Session logged out" });
        return;
      }
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
export const requireRole = (...roles: Array<"ADMIN" | "DRIVER" | "OPERATOR">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
};
