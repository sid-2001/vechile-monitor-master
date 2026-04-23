import { FilterQuery } from "mongoose";
import { Base, IBase } from "../models/Base";
import { Geofence } from "../models/Geofence";

export class BaseService {
  async create(payload: Partial<IBase>, actor: string): Promise<any> {
    const { createdby, ...safePayload } = payload as any;
    const base = new Base(safePayload);
    base.$locals.currentUser = actor;
    const saved = await base.save();
    if (payload.geofenceId) {
      await Geofence.findByIdAndUpdate(payload.geofenceId, { baseId: saved._id });
    }
    return saved;
  }

  async list(filter: FilterQuery<IBase>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      Base.find(filter).skip(options.skip).limit(options.limit).sort(options.sort).populate("geofenceId", "name radius").populate("locationId", "name country state city"),
      Base.countDocuments(filter)
    ]);
    return { items, total };
  }

  async byId(id: string): Promise<any> { return Base.findById(id).populate("geofenceId", "name radius").populate("locationId", "name country state city"); }
  async update(id: string, payload: Partial<IBase>, actor: string): Promise<any> {
    const updated = await Base.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
    if (updated?.geofenceId) {
      await Geofence.findByIdAndUpdate(updated.geofenceId, { baseId: updated._id });
    }
    return updated;
  }
  async remove(id: string): Promise<any> { return Base.findByIdAndDelete(id); }
}

export const baseService = new BaseService();
