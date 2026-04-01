import { Request } from "express";

export const buildQueryOptions = (req: Request): { page: number; limit: number; skip: number; sort: Record<string, 1 | -1> } => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;
  const sortField = String(req.query.sort || "createdUtcDateTime");
  const sortOrder = String(req.query.order || "desc") === "asc" ? 1 : -1;
  return { page, limit, skip, sort: { [sortField]: sortOrder } };
};
