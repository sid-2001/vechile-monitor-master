import { NextFunction, Request, Response } from "express";

export type ValidatorFn = (body: unknown) => string[];

export const validateBody = (validator: ValidatorFn) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validator(req.body);
  if (errors.length > 0) {
    res.status(422).json({ message: "Validation failed", details: errors });
    return;
  }
  next();
};
