import { Request, Response } from "express";
import { deviceService } from "../services/device.service";

export class DeviceController {
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await deviceService.create(req.body, req.user?.username || "SYSTEM"));
  }

  async list(req: Request, res: Response): Promise<void> {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    res.json({ items: await deviceService.list(filter) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await deviceService.update(req.params.id, req.body, req.user?.username || "SYSTEM");
    if (!item) {
      res.status(404).json({ message: "Device not found" });
      return;
    }
    res.json(item);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const item = await deviceService.remove(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Device not found" });
      return;
    }
    res.json({ message: "Deleted" });
  }

  async link(req: Request, res: Response): Promise<void> {
    const item = await deviceService.linkToVehicle(req.params.id, req.body?.vehicleId || null, req.user?.username || "SYSTEM");
    if (!item) {
      res.status(404).json({ message: "Device not found" });
      return;
    }
    res.json(item);
  }
}

export const deviceController = new DeviceController();
