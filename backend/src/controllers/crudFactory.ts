import { Request, Response } from "express";
import { Model } from "mongoose";
import { buildPagination, getSearchFilter, omitAuditFields } from "../utils/query";

export const createCrudController = <T>(
  model: Model<T>,
  searchFields: string[],
  extraFilterBuilder?: (req: Request) => Record<string, unknown>
) => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const payload = omitAuditFields(req.body);
    const doc = new model(payload);
    doc.$locals.currentUser = req.user?.username || "SYSTEM";
    await doc.save();
    res.status(201).json(doc);
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const { page, limit, skip } = buildPagination(req);
    const filter = {
      ...getSearchFilter(req, searchFields),
      ...(extraFilterBuilder ? extraFilterBuilder(req) : {})
    };

    const [items, total] = await Promise.all([
      model.find(filter).skip(skip).limit(limit).sort({ _id: -1 }),
      model.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const item = await model.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(item);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const payload = omitAuditFields(req.body);
    const item = await model.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
        currentUser: req.user?.username || "SYSTEM"
      } as never
    );

    if (!item) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(item);
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const deleted = await model.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json({ message: "Deleted" });
  }
});
