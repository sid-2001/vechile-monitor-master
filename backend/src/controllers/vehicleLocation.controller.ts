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


  async cacheLocation(req: Request, res: Response): Promise<void> {
    const payload = req.body as {
      vehicleId: string;
      deviceId: string;
      latitude: number;
      longitude: number;
      speed: number;
      ignition: boolean;
      time: string;
      angle?: number;
      source?: "live" | "simulation";
      vehicleNumber?: string;
    };

    const data = await vehicleLocationService.cacheLiveLocation(payload);
    res.status(201).json(data);
  }

  async liveFromCache(req: Request, res: Response): Promise<void> {
    const item = await vehicleLocationService.getCachedLiveLocation(req.params.vehicleId);
    if (!item) {
      res.status(404).json({ message: "No cached location data" });
      return;
    }

    res.json(item);
  }

  async vectorTileHistory(req: Request, res: Response): Promise<void> {
    const z = Number(req.query.z || 0);
    const x = Number(req.query.x || 0);
    const y = Number(req.query.y || 0);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const limit = Number(req.query.limit || 5000);
    const sampleSeconds = Number(req.query.sampleSeconds || 0);

    if ([z, x, y, limit, sampleSeconds].some((item) => Number.isNaN(item))) {
      res.status(422).json({ message: "Invalid vector tile parameters" });
      return;
    }

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      res.status(422).json({ message: "Invalid date range" });
      return;
    }

    const data = await vehicleLocationService.getVectorTileHistory({
      vehicleId: req.params.vehicleId,
      z,
      x,
      y,
      from,
      to,
      limit,
      sampleSeconds,
    });

    res.json(data);
  }


  async vectorTilePbf(req: Request, res: Response): Promise<void> {
    const z = Number(req.params.z);
    const x = Number(req.params.x);
    const y = Number(req.params.y);

    if ([z, x, y].some((item) => Number.isNaN(item))) {
      res.status(422).json({ message: "Invalid tile coordinates" });
      return;
    }

    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      res.status(422).json({ message: "Invalid date range" });
      return;
    }

    const vehicleIds = String(req.query.vehicleIds || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tileBuffer = await vehicleLocationService.getVectorTilePbf({
      z,
      x,
      y,
      from,
      to,
      vehicleIds,
      source: req.query.source === "simulation" ? "simulation" : "live",
    });

    if (!tileBuffer) {
      res.status(204).end();
      return;
    }

    res.setHeader("Content-Type", "application/x-protobuf");
    res.setHeader("Content-Encoding", "identity");
    res.setHeader("Cache-Control", "public, max-age=120");
    res.status(200).send(tileBuffer);
  }

  async timeline(req: Request, res: Response): Promise<void> {
    const MAX_TIMELINE_WINDOW_MS = 24 * 60 * 60 * 1000;
    const vehicleIds = String(req.query.vehicleIds || '').split(',').map((id) => id.trim()).filter(Boolean);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - MAX_TIMELINE_WINDOW_MS);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const bucket = String(req.query.bucket || 'month') as "month" | "week" | "day" | "hour" | "minute" | "second";
    const binSize = Math.max(1, Number(req.query.binSize || 1));

    if (!vehicleIds.length) {
      res.json({ items: [], total: 0 });
      return;
    }
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      res.status(422).json({ message: "Invalid timeline date range" });
      return;
    }
    if (from > to) {
      res.status(422).json({ message: "From date must be before To date" });
      return;
    }
    if (to.getTime() - from.getTime() > MAX_TIMELINE_WINDOW_MS) {
      res.status(422).json({ message: "Timeline range cannot exceed 24 hours" });
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
