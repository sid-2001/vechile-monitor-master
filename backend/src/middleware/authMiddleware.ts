import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "../types/express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
