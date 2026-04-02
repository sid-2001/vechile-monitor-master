import { Document, model, Schema } from "mongoose";
import { auditPlugin } from "../plugins/auditPlugin";
import { AuditFields } from "./audit";

export interface IDevice extends Document, AuditFields {
  name: string;
  imei: string;
  simNumber?: string;
  status: "ONBOARDED" | "LINKED";
  linkedVehicleId?: Schema.Types.ObjectId;
}

const schema = new Schema<IDevice>({
  name: { type: String, required: true },
  imei: { type: String, required: true, unique: true, index: true },
  simNumber: { type: String },
  status: { type: String, enum: ["ONBOARDED", "LINKED"], default: "ONBOARDED", index: true },
  linkedVehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" }
});

schema.plugin(auditPlugin);

export const Device = model<IDevice>("Device", schema);
