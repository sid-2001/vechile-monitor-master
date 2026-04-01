import { Request, Response } from "express";
import { vehicleService } from "../services/vehicle.service";
import { buildQueryOptions } from "../utils/query";

export class VehicleController {
  async create(req: Request, res: Response): Promise<void> { res.status(201).json(await vehicleService.create(req.body, req.user?.username || "SYSTEM")); }
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.baseId) filter.baseId = req.query.baseId;
    if (req.query.driverId) filter.driverId = req.query.driverId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter["status.isActive"] = req.query.status === "ACTIVE";
    if (req.query.search) filter.vehicleNumber = { $regex: req.query.search, $options: "i" };
    const data = await vehicleService.list(filter, options);
    res.json({ ...options, total: data.total, items: data.items });
  }
  async byId(req: Request, res: Response): Promise<void> { const item = await vehicleService.byId(req.params.id); if (!item) return void res.status(404).json({ message: "Not found" }); res.json(item); }
  async update(req: Request, res: Response): Promise<void> { const item = await vehicleService.update(req.params.id, req.body, req.user?.username || "SYSTEM"); if (!item) return void res.status(404).json({ message: "Not found" }); res.json(item); }
  async remove(req: Request, res: Response): Promise<void> { const item = await vehicleService.remove(req.params.id); if (!item) return void res.status(404).json({ message: "Not found" }); res.json({ message: "Deleted" }); }
}
export const vehicleController = new VehicleController();
