import { FilterQuery } from "mongoose";
import { ILocation, Location } from "../models/Location";

export class LocationService {
  async create(payload: Partial<ILocation>, actor: string): Promise<any> {
    const location = new Location(payload);
    location.$locals.currentUser = actor;
    return location.save();
  }

  async list(filter: FilterQuery<ILocation>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      Location.find(filter).skip(options.skip).limit(options.limit).sort(options.sort),
      Location.countDocuments(filter),
    ]);
    return { items, total };
  }

  byId(id: string): Promise<any> { return Location.findById(id); }
  update(id: string, payload: Partial<ILocation>, actor: string): Promise<any> {
    return Location.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
  }
  remove(id: string): Promise<any> { return Location.findByIdAndDelete(id); }
}

export const locationService = new LocationService();
