import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { buildQueryOptions } from "../utils/query";

export class UserController {
  async create(req: Request, res: Response): Promise<void> { res.status(201).json(await userService.create(req.body, req.user?.username || "SYSTEM")); }
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.baseId) filter.baseIds = req.query.baseId;
    if (req.query.search) filter.username = { $regex: req.query.search, $options: "i" };
    const data = await userService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }
  async byId(req: Request, res: Response): Promise<void> { const item = await userService.byId(req.params.id); if (!item) return void res.status(404).json({ message: "Not found" }); res.json(item); }
  async update(req: Request, res: Response): Promise<void> { const item = await userService.update(req.params.id, req.body, req.user?.username || "SYSTEM"); if (!item) return void res.status(404).json({ message: "Not found" }); res.json(item); }
  async remove(req: Request, res: Response): Promise<void> { const item = await userService.remove(req.params.id); if (!item) return void res.status(404).json({ message: "Not found" }); res.json({ message: "Deleted" }); }
}
export const userController = new UserController();
