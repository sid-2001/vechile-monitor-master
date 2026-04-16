import { Request, Response } from "express";
import { geofenceService } from "../services/geofence.service";
import { buildQueryOptions } from "../utils/query";

export class GeofenceController {
  async create(req: Request, res: Response): Promise<void> {
    const item = await geofenceService.create(req.body, req.user?.username || "SYSTEM");
    res.status(201).json(item);
  }

  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.baseId) filter.baseId = req.query.baseId;
    const data = await geofenceService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }

  async byId(req: Request, res: Response): Promise<void> {
    const item = await geofenceService.byId(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await geofenceService.update(req.params.id, req.body, req.user?.username || "SYSTEM");
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const item = await geofenceService.remove(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  }
}

export const geofenceController = new GeofenceController();
