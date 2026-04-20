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
    if (req.query.source) filter.source = req.query.source;
    if (req.query.excludeSource) filter.source = { $ne: req.query.excludeSource };
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

  async analytics(req: Request, res: Response): Promise<void> {
    const data = await vehicleLocationService.getAnalytics(req.params.vehicleId);
    res.json(data);
  }

  async timeline(req: Request, res: Response): Promise<void> {
    const vehicleIds = String(req.query.vehicleIds || '').split(',').map((id) => id.trim()).filter(Boolean);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const bucket = String(req.query.bucket || 'month') as "month" | "week" | "day" | "hour" | "minute" | "second";
    const binSize = Math.max(1, Number(req.query.binSize || 1));

    if (!vehicleIds.length) {
      res.json({ items: [], total: 0 });
      return;
    }

    const items = await vehicleLocationService.getTimeline({
      vehicleIds,
      from,
      to,
      bucket,
      binSize,
      excludeSimulation: req.query.excludeSimulation !== 'false',
    });

    res.json({ items, total: items.length });
  }
}
export const vehicleLocationController = new VehicleLocationController();
