import { IRole, MODULE_KEYS, ModulePermissions, Role } from "../models/Role";

const normalizePermissions = (permissions: ModulePermissions = {}): ModulePermissions => {
  return MODULE_KEYS.reduce((acc, key) => {
    acc[key] = permissions[key] || "NONE";
    return acc;
  }, {} as ModulePermissions);
};

export class RoleService {
  async create(payload: Partial<IRole>, actor: string): Promise<any> {
    const role = new Role({ ...payload, permissions: normalizePermissions(payload.permissions) });
    role.$locals.currentUser = actor;
    return role.save();
  }

  async list() {
    return Role.find().sort({ name: 1 });
  }

  async byId(id: string) {
    return Role.findById(id);
  }

  async update(id: string, payload: Partial<IRole>, actor: string) {
    const next = { ...payload } as Partial<IRole>;
    if (next.permissions) next.permissions = normalizePermissions(next.permissions);
    return Role.findByIdAndUpdate(id, next, { new: true, runValidators: true, currentUser: actor } as never);
  }

  async remove(id: string) {
    return Role.findByIdAndDelete(id);
  }
}

export const roleService = new RoleService();
