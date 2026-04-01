import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import { buildPagination, getSearchFilter, omitAuditFields } from "../utils/query";

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const payload = omitAuditFields(req.body) as Record<string, string>;
  payload.password = await bcrypt.hash(String(payload.password), 10);
  const user = new User(payload);
  user.$locals.currentUser = req.user?.username || "SYSTEM";
  await user.save();
  res.status(201).json(user);
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {
    ...getSearchFilter(req, ["username", "displayName", "role"]),
    ...(req.query.baseId ? { baseId: req.query.baseId } : {})
  };
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").skip(skip).limit(limit).sort({ _id: -1 }),
    User.countDocuments(filter)
  ]);
  res.json({ page, limit, total, items });
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const item = await User.findById(req.params.id).select("-password");
  if (!item) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(item);
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const payload = omitAuditFields(req.body) as Record<string, string>;
  if (payload.password) payload.password = await bcrypt.hash(payload.password, 10);

  const item = await User.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
    currentUser: req.user?.username || "SYSTEM"
  } as never).select("-password");

  if (!item) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(item);
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json({ message: "Deleted" });
};
