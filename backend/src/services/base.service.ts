import { FilterQuery } from "mongoose";
import { Base, IBase } from "../models/Base";

export class BaseService {
  async create(payload: Partial<IBase>, actor: string): Promise<any> {
    const base = new Base(payload);
    base.$locals.currentUser = actor;
    return base.save();
  }

  async list(filter: FilterQuery<IBase>, options: { skip: number; limit: number; sort: Record<string, 1 | -1> }) {
    const [items, total] = await Promise.all([
      Base.find(filter).skip(options.skip).limit(options.limit).sort(options.sort),
      Base.countDocuments(filter)
    ]);
    return { items, total };
  }

  async byId(id: string): Promise<any> { return Base.findById(id); }
  async update(id: string, payload: Partial<IBase>, actor: string): Promise<any> {
    return Base.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
  }
  async remove(id: string): Promise<any> { return Base.findByIdAndDelete(id); }
}

export const baseService = new BaseService();
