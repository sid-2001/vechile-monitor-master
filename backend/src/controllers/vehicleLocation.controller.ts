import { Request, Response } from "express";
import { vehicleLocationService } from "../services/vehicleLocation.service";
import { buildQueryOptions } from "../utils/query";

export class VehicleLocationController {
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await vehicleLocationService.create(req.body, req.user?.username || "SYSTEM"));
  }
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    if (req.query.from || req.query.to) {
      filter.time = {};
      if (req.query.from) (filter.time as Record<string, unknown>).$gte = new Date(String(req.query.from));
      if (req.query.to) (filter.time as Record<string, unknown>).$lte = new Date(String(req.query.to));
    }
    const data = await vehicleLocationService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }
  async latest(req: Request, res: Response): Promise<void> {
    const item = await vehicleLocationService.latest(req.params.vehicleId);
    if (!item) return void res.status(404).json({ message: "No location data" });
    res.json(item);
  }
}
export const vehicleLocationController = new VehicleLocationController();
