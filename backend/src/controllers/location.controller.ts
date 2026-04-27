import { Request, Response } from "express";
import { locationService } from "../services/location.service";
import { buildQueryOptions } from "../utils/query";

export class LocationController {
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await locationService.create(req.body, req.user?.username || "SYSTEM"));
  }
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.country) filter.country = req.query.country;
    if (req.query.state) filter.state = req.query.state;
    if (req.query.city) filter.city = req.query.city;
    const data = await locationService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }
  async byId(req: Request, res: Response): Promise<void> {
    const item = await locationService.byId(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }
  async update(req: Request, res: Response): Promise<void> {
    const item = await locationService.update(req.params.id, req.body, req.user?.username || "SYSTEM");
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json(item);
  }
  async remove(req: Request, res: Response): Promise<void> {
    const item = await locationService.remove(req.params.id);
    if (!item) return void res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  }
}
export const locationController = new LocationController();
