import { Request, Response } from "express";
import { MODULE_KEYS } from "../models/Role";
import { roleService } from "../services/role.service";

export class RoleController {
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await roleService.create(req.body, req.user?.username || "SYSTEM"));
  }

  async list(_req: Request, res: Response): Promise<void> {
    res.json({ items: await roleService.list(), modules: MODULE_KEYS });
  }

  async byId(req: Request, res: Response): Promise<void> {
    const item = await roleService.byId(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await roleService.update(req.params.id, req.body, req.user?.username || "SYSTEM");
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const item = await roleService.remove(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  }
}

export const roleController = new RoleController();
