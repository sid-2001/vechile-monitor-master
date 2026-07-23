import { Request, Response } from "express";
import { Types } from "mongoose";
import { VehicleStopHistory } from "../models/VehicleStopHistory";
import { buildQueryOptions } from "../utils/query";

export class VehicleStopHistoryController {
  async list(req: Request, res: Response): Promise<void> {
    const options = buildQueryOptions(req);

    const filter: Record<string, any> = {};

    if (req.query.vehicleId) {
      const vehicleId = String(req.query.vehicleId);

      if (!Types.ObjectId.isValid(vehicleId)) {
        res.status(422).json({
          message: "Invalid vehicleId",
        });

        return;
      }

      filter.vehicleId = new Types.ObjectId(vehicleId);
    }

    if (req.query.classification) {
      filter.classification = String(
        req.query.classification
      );
    }

    // if (req.query.from || req.query.to) {
    //   filter.startedAt = {};

    //   if (req.query.from) {
    //     filter.startedAt.$gte = new Date(
    //       String(req.query.from)
    //     );
    //   }

    //   if (req.query.to) {
    //     filter.startedAt.$lte = new Date(
    //       String(req.query.to)
    //     );
    //   }
    // }

    if (req.query.fromDate || req.query.toDate) {
  filter.startedAt = {};

  if (req.query.fromDate) {
    filter.startedAt.$gte = new Date(
      String(req.query.fromDate)
    );
  }

  if (req.query.toDate) {
    const endDate = new Date(
      String(req.query.toDate)
    );

    endDate.setHours(23, 59, 59, 999);

    filter.startedAt.$lte = endDate;
  }
}

    const [items, total] = await Promise.all([
      VehicleStopHistory.find(filter)
        .populate(
          "vehicleId",
          "vehicleNumber vehicle_tag_name"
        )
        .populate("geofenceId", "name")
        .skip(options.skip)
        .limit(options.limit)
        .sort({ startedAt: -1 }),

      VehicleStopHistory.countDocuments(filter),
    ]);

    res.json({
      ...options,
      total,
      items,
    });
  }

  async byId(req: Request, res: Response): Promise<void> {
    const item = await VehicleStopHistory.findById(
      req.params.id
    )
      .populate(
        "vehicleId",
        "vehicleNumber vehicle_tag_name"
      )
      .populate("geofenceId", "name");

    if (!item) {
      res.status(404).json({
        message: "Stop history not found",
      });

      return;
    }

    res.json(item);
  }
}

export const vehicleStopHistoryController =
  new VehicleStopHistoryController();