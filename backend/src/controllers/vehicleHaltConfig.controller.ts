import { Request, Response } from "express";
import { vehicleHaltConfigService } from "../services/vehicleHaltConfig.service";
import { buildQueryOptions } from "../utils/query";

export class VehicleHaltConfigController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const item = await vehicleHaltConfigService.create(
        req.body,
        req.user?.username || "SYSTEM"
      );

      res.status(201).json(item);
    } catch (error: any) {
      res.status(422).json({
        message: error.message || "Unable to create halt configuration",
      });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);

    const filter: Record<string, unknown> = {};

    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }

    const data = await vehicleHaltConfigService.list(
      filter,
      options
    );

    res.json({
      ...options,
      total: data.total,
      items: data.items,
    });
  }

  async byId(req: Request, res: Response): Promise<void> {
    const item = await vehicleHaltConfigService.byId(
      req.params.id
    );

    if (!item) {
      res.status(404).json({
        message: "Halt configuration not found",
      });

      return;
    }

    res.json(item);
  }

  async byVehicleId(
    req: Request,
    res: Response
  ): Promise<void> {
    const item =
      await vehicleHaltConfigService.byVehicleId(
        req.params.vehicleId
      );

    if (!item) {
      res.status(404).json({
        message: "Halt configuration not found",
      });

      return;
    }

    res.json(item);
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await vehicleHaltConfigService.update(
      req.params.id,
      req.body,
      req.user?.username || "SYSTEM"
    );

    if (!item) {
      res.status(404).json({
        message: "Halt configuration not found",
      });

      return;
    }

    res.json(item);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const item = await vehicleHaltConfigService.remove(
      req.params.id
    );

    if (!item) {
      res.status(404).json({
        message: "Halt configuration not found",
      });

      return;
    }

    res.json({
      message: "Halt configuration deleted",
    });
  }
}

export const vehicleHaltConfigController =
  new VehicleHaltConfigController();