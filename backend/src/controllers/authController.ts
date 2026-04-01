import { Request, Response } from "express";
import { forgotPassword, loginUser } from "../services/authService";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const result = await loginUser(username, password);
  res.json(result);
};

export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  const { username, passcode, newPassword } = req.body;
  await forgotPassword(username, passcode, newPassword);
  res.json({ message: "Password reset successful" });
};
