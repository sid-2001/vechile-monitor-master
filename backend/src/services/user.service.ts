import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { IUser, User } from "../models/User";

export class UserService {
  async create(payload: Partial<IUser>, actor: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(payload.password || "Admin@123", 10);
    const user = new User({ ...payload, password: hashedPassword });
    user.$locals.currentUser = actor;
    return user.save();
  }

  async list(filter: Record<string, unknown>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      User.find(filter).select("-password").skip(options.skip).limit(options.limit).sort(options.sort),
      User.countDocuments(filter)
    ]);
    return { items, total };
  }

  async byId(id: string): Promise<any> { return User.findById(id).select("-password"); }

  async update(id: string, payload: Partial<IUser>, actor: string): Promise<any> {
    const next = { ...payload } as Partial<IUser>;
    if (next.password) next.password = await bcrypt.hash(next.password, 10) as never;
    return User.findByIdAndUpdate(id, next, { new: true, runValidators: true, currentUser: actor } as never).select("-password");
  }

  async remove(id: string): Promise<any> { return User.findByIdAndDelete(id); }

  async login(username: string, password: string): Promise<{ token: string ,user:any}> {
    try{

    const user = await User.findOne({ username });
    if (!user) throw new Error("Invalid credentials");
    if (user.status === "LOCKED") throw new Error("User locked due to failed attempts");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 3) user.status = "LOCKED";
      user.$locals.currentUser = username;
      await user.save();
      throw new Error(user.status === "LOCKED" ? "User locked due to failed attempts" : "Invalid credentials");
    }

    user.failedAttempts = 0;
    user.status = "ACTIVE";
    user.lastLoginTime = new Date();
    user.firstLoggedIn = false;
    user.$locals.currentUser = username;
    await user.save();

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, env.jwtSecret, { expiresIn: "1d" });
    return { token,user };
  }catch(err){

    console.log(err)
  }
  }

  async generatePasscode(username: string, actor: string): Promise<{ temporaryPasscode: string }> {
    const user = await User.findOne({ username });
    if (!user) throw new Error("User not found");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.temporaryPasscode = code;
    user.$locals.currentUser = actor;
    await user.save();
    return { temporaryPasscode: code };
  }

  async resetPassword(username: string, passcode: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ username });
    if (!user || user.temporaryPasscode !== passcode) throw new Error("Invalid passcode");
    user.password = await bcrypt.hash(newPassword, 10);
    user.temporaryPasscode = undefined;
    user.failedAttempts = 0;
    user.status = "ACTIVE";
    user.$locals.currentUser = username;
    await user.save();
  }
}

export const userService = new UserService();
