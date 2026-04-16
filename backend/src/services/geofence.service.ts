import { FilterQuery } from "mongoose";
import { Geofence, IGeofence } from "../models/Geofence";
import { Base } from "../models/Base";

export class GeofenceService {
  async create(payload: Partial<IGeofence>, actor: string): Promise<any> {
    const geofence = new Geofence(payload);
    geofence.$locals.currentUser = actor;
    const saved = await geofence.save();
    await Base.findByIdAndUpdate(saved.baseId, { geofenceId: saved._id });
    return saved.populate("baseId", "name address.city address.state");
  }

  async list(filter: FilterQuery<IGeofence>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      Geofence.find(filter).skip(options.skip).limit(options.limit).sort(options.sort).populate("baseId", "name address.city address.state"),
      Geofence.countDocuments(filter)
    ]);
    return { items, total };
  }

  async byId(id: string): Promise<any> {
    return Geofence.findById(id).populate("baseId", "name address.city address.state");
  }

  async update(id: string, payload: Partial<IGeofence>, actor: string): Promise<any> {
    const prev = await Geofence.findById(id);
    const updated = await Geofence.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
    if (!updated) return null;

    if (payload.baseId && String(payload.baseId) !== String(prev?.baseId)) {
      await Base.findByIdAndUpdate(prev?.baseId, { $unset: { geofenceId: 1 } });
    }
    await Base.findByIdAndUpdate(updated.baseId, { geofenceId: updated._id });
    return updated.populate("baseId", "name address.city address.state");
  }

  async remove(id: string): Promise<any> {
    const deleted = await Geofence.findByIdAndDelete(id);
    if (deleted) {
      await Base.updateMany({ geofenceId: deleted._id }, { $unset: { geofenceId: 1 } });
    }
    return deleted;
  }
}

export const geofenceService = new GeofenceService();
