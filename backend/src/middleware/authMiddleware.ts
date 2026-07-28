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


const ACCESS_RANK: Record<string, number> = { NONE: 0, READ: 1, WRITE: 2, UPDATE: 3, DELETE: 4, FULL: 5 };

const methodAccess = (method: string): "READ" | "WRITE" | "UPDATE" | "DELETE" => {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return "READ";
  if (method === "POST") return "WRITE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  return "READ";
};

export const requireModuleAccess = (module: string, minimum?: "READ" | "WRITE" | "UPDATE" | "DELETE") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role === "ADMIN") return next();
    const requiredAccess = minimum || methodAccess(req.method);
    const access = req.user?.permissions?.[module] || "NONE";
    if ((ACCESS_RANK[access] || 0) < ACCESS_RANK[requiredAccess]) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
};
