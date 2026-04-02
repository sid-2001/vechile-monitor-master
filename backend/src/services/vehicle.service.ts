import { IVehicle, Vehicle } from "../models/Vehicle";
import { VehicleLocation } from "../models/VehicleLocation";
import { emitVehicleLocationUpdate } from "../socket/vehicle.socket";

const getRandomSeedLocation = () => {
  const baseLat = 20.5937;
  const baseLng = 78.9629;
  return {
    latitude: Number((baseLat + (Math.random() - 0.5) * 8).toFixed(6)),
    longitude: Number((baseLng + (Math.random() - 0.5) * 8).toFixed(6)),
  };
};

export class VehicleService {
  async create(payload: Partial<IVehicle>, actor: string): Promise<any> {
    const doc = new Vehicle(payload);
    doc.$locals.currentUser = actor;
    const saved = await doc.save();

    const seed = getRandomSeedLocation();
    const seedLocation = await new VehicleLocation({
      vehicleId: saved._id,
      deviceId: saved.deviceId,
      time: new Date(),
      latitude: seed.latitude,
      longitude: seed.longitude,
      speed: 0,
      ignition: false,
    }).save();

    emitVehicleLocationUpdate({
      vehicleId: String(saved._id),
      latitude: seedLocation.latitude,
      longitude: seedLocation.longitude,
      speed: seedLocation.speed,
      ignition: seedLocation.ignition,
      time: seedLocation.time,
    });

    return saved;
  }

  async list(filter: Record<string, unknown>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      Vehicle.find(filter).populate("baseId driverId", "name username").skip(options.skip).limit(options.limit).sort(options.sort),
      Vehicle.countDocuments(filter)
    ]);
    return { items, total };
  }

  byId(id: string) { return Vehicle.findById(id).populate("baseId driverId", "name username"); }
  update(id: string, payload: Partial<IVehicle>, actor: string) {
    return Vehicle.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
  }
  remove(id: string) { return Vehicle.findByIdAndDelete(id); }
}

export const vehicleService = new VehicleService();
