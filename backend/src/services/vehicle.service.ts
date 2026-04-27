import { IVehicle, Vehicle } from "../models/Vehicle";

export class VehicleService {
  async create(payload: Partial<IVehicle>, actor: string): Promise<any> {
    const doc = new Vehicle(payload);
    doc.$locals.currentUser = actor;
    return doc.save();
  }

  async list(
    filter: Record<string, unknown>,
    options: { skip: number; limit: number; sort: Record<string, 1 | -1> }
  ) {
    const [items, total] = await Promise.all([
      Vehicle.find(filter)
        .populate("baseId driverId", "name username")
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort),
      Vehicle.countDocuments(filter),
    ]);
    return { items, total };
  }

  // 🔥 ONLY CHANGE HERE
  byId(id: string) {
    return Vehicle.findById(id)
      .populate("baseId driverId", "name username")
      .lean(); 
  }

  update(id: string, payload: Partial<IVehicle>, actor: string) {
    return Vehicle.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      currentUser: actor,
    } as never);
  }

async remove(id: string) {
  return Vehicle.findByIdAndDelete(id);
}
}

export const vehicleService = new VehicleService();