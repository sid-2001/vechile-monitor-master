import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IVehicle extends Document, AuditFields {
  vehicleNumber: string;
  type: string;
  model: string;
  status: "ACTIVE" | "INACTIVE";
  baseId: Schema.Types.ObjectId;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    baseId: { type: Schema.Types.ObjectId, ref: "Base", required: true }
  },
  { timestamps: false }
);

vehicleSchema.plugin(auditPlugin);

export const Vehicle = model<IVehicle>("Vehicle", vehicleSchema);
