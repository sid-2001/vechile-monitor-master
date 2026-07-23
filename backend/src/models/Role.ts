import mongoose, { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export type AccessLevel = "NONE" | "READ" | "WRITE";

export const MODULE_KEYS = [
  "dashboard",
  "users",
  "roles",
  "locations",
  "geofences",
  "bases",
  "vehicles",
  "devices",
  "sims",
  "kilometerCards",
  "deviceSimMapping",
  "tracking",
  "locationHistory",
  "analytics",
  "loginDevices",
  "testSignals",
  "haltConfiguration",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModulePermissions = Partial<Record<ModuleKey, AccessLevel>>;

export interface IRole extends Document, AuditFields {
  name: string;
  description?: string;
  permissions: ModulePermissions;
  isSystem: boolean;
  status: "ACTIVE" | "INACTIVE";
}

const schema = new Schema<IRole>({
  name: { type: String, unique: true, required: true, trim: true },
  description: { type: String, trim: true },
  permissions: {
    type: Map,
    of: { type: String, enum: ["NONE", "READ", "WRITE"], default: "NONE" },
    default: {},
  },
  isSystem: { type: Boolean, default: false },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
});

schema.plugin(auditPlugin);

export const Role = mongoose.models.Role || model<IRole>("Role", schema);
