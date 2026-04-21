import { NextFunction, Request, Response } from "express";

type ApiError = Error & { statusCode?: number; code?: string; details?: unknown };

export const errorMiddleware = (err: ApiError, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = Number(err?.statusCode) || 500;
  const message = err?.message || "Internal Server Error";

  console.error("API Error:", {
    message,
    statusCode,
    code: err?.code,
    details: err?.details,
    stack: err?.stack,
  });

  res.status(statusCode).json({
    message,
    code: err?.code || "INTERNAL_ERROR",
    details: err?.details || undefined,
  });
};
