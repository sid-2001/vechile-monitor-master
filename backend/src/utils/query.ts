import { Request } from "express";

export const buildPagination = (req: Request): { page: number; limit: number; skip: number } => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const getSearchFilter = (req: Request, fields: string[]): Record<string, unknown> => {
  const search = String(req.query.search || "").trim();
  if (!search) return {};
  return {
    $or: fields.map((field) => ({ [field]: { $regex: search, $options: "i" } }))
  };
};

const auditKeys = [
  "createdBy",
  "createdLocalDateTime",
  "createdOffset",
  "createdTimezone",
  "createdUtcDateTime",
  "modifiedBy",
  "modifiedLocalDateTime",
  "modifiedOffset",
  "modifiedTimezone",
  "modifiedUtcDateTime"
];

export const omitAuditFields = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
  const next = { ...payload };
  for (const k of auditKeys) {
    delete (next as Record<string, unknown>)[k];
  }
  return next;
};
