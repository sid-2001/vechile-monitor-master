import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";

export const generateToken = (id: string, username: string): string =>
  jwt.sign({ id, username }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const loginUser = async (username: string, password: string): Promise<{ token: string }> => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Invalid credentials");
  if (user.isLocked) throw new Error("Account locked due to failed attempts");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= 3) user.isLocked = true;
    user.$locals.currentUser = username;
    await user.save();
    throw new Error(user.isLocked ? "Account locked due to failed attempts" : "Invalid credentials");
  }

  user.failedAttempts = 0;
  user.isLocked = false;
  user.$locals.currentUser = username;
  await user.save();

  return { token: generateToken(user.id, user.username) };
};

export const forgotPassword = async (
  username: string,
  passcode: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findOne({ username });
  if (!user || user.passcode !== passcode) throw new Error("Invalid username/passcode");

  user.password = await bcrypt.hash(newPassword, 10);
  user.failedAttempts = 0;
  user.isLocked = false;
  user.$locals.currentUser = username;
  await user.save();
};
