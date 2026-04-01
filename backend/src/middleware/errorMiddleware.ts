import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(400).json({ message: err.message || "Something went wrong" });
};
