import { Request, Response } from "express";
import { baseService } from "../services/base.service";
import { buildQueryOptions } from "../utils/query";

export class BaseController {
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await baseService.create(req.body, req.user?.username || "SYSTEM"));
  }
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.state) filter["address.state"] = req.query.state;
    if (req.query.city) filter["address.city"] = req.query.city;
    const data = await baseService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }
  async byId(req: Request, res: Response): Promise<void> {
    const item = await baseService.byId(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }
  async update(req: Request, res: Response): Promise<void> {
    const item = await baseService.update(req.params.id, req.body, req.user?.username || "SYSTEM");
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }
  async remove(req: Request, res: Response): Promise<void> {
    const item = await baseService.remove(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  }
}
export const baseController = new BaseController();
