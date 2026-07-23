import { Types } from "mongoose";
import {
  IVehicleHaltConfig,
  VehicleHaltConfig,
} from "../models/VehicleHaltConfig";
import { Vehicle } from "../models/Vehicle";

export class VehicleHaltConfigService {
  async create(
    payload: Partial<IVehicleHaltConfig>,
    actor: string
  ): Promise<any> {
    if (!payload.vehicleId) {
      throw new Error("vehicleId is required");
    }

    const vehicleExists = await Vehicle.exists({
      _id: payload.vehicleId,
    });

    if (!vehicleExists) {
      throw new Error("Vehicle not found");
    }

    const existingConfig = await VehicleHaltConfig.findOne({
      vehicleId: payload.vehicleId,
    });

    if (existingConfig) {
      throw new Error(
        "Halt configuration already exists for this vehicle"
      );
    }

    const doc = new VehicleHaltConfig(payload);

    doc.$locals.currentUser = actor;

    return doc.save();
  }

  async list(
    filter: Record<string, unknown>,
    options: {
      skip: number;
      limit: number;
      sort: Record<string, 1 | -1>;
    }
  ) {
    const [items, total] = await Promise.all([
      VehicleHaltConfig.find(filter)
        .populate(
          "vehicleId",
          "vehicleNumber vehicle_tag_name deviceId baseId"
        )
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort),

      VehicleHaltConfig.countDocuments(filter),
    ]);

    return {
      items,
      total,
    };
  }

  async byId(id: string) {
    return VehicleHaltConfig.findById(id)
      .populate(
        "vehicleId",
        "vehicleNumber vehicle_tag_name deviceId baseId"
      )
      .lean();
  }

  async byVehicleId(vehicleId: string) {
    if (!Types.ObjectId.isValid(vehicleId)) {
      return null;
    }

    return VehicleHaltConfig.findOne({
      vehicleId: new Types.ObjectId(vehicleId),
    }).lean();
  }

  async update(
    id: string,
    payload: Partial<IVehicleHaltConfig>,
    actor: string
  ) {
    return VehicleHaltConfig.findByIdAndUpdate(
      id,
      payload,
      {
        new: true,
        runValidators: true,
        currentUser: actor,
      } as never
    );
  }

  async remove(id: string) {
    return VehicleHaltConfig.findByIdAndDelete(id);
  }
}

export const vehicleHaltConfigService =
  new VehicleHaltConfigService();