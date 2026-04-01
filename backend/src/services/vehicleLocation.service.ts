import { IVehicleLocation, VehicleLocation } from "../models/VehicleLocation";
import { emitVehicleLocationUpdate } from "../socket/vehicle.socket";

export class VehicleLocationService {
  async create(payload: Partial<IVehicleLocation>, actor: string): Promise<any> {
    const doc = new VehicleLocation(payload);
    doc.$locals.currentUser = actor;
    const saved = await doc.save();
    emitVehicleLocationUpdate({ vehicleId: String(saved.vehicleId), latitude: saved.latitude, longitude: saved.longitude, speed: saved.speed, ignition: saved.ignition, time: saved.time });
    return saved;
  }

  async list(filter: Record<string, unknown>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      VehicleLocation.find(filter).skip(options.skip).limit(options.limit).sort(options.sort),
      VehicleLocation.countDocuments(filter)
    ]);
    return { items, total };
  }

  latest(vehicleId: string) { return VehicleLocation.findOne({ vehicleId }).sort({ time: -1 }); }
}

export const vehicleLocationService = new VehicleLocationService();
