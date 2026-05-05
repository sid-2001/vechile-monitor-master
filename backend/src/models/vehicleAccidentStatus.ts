
import { Document, Schema, model } from "mongoose";
import { auditPlugin } from "../plugins/auditPlugin";
import { AuditFields } from "./audit";

export interface IVehicleAccidentStatus extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  speed: number;
  latitude: number;
  longitude: number;
  pitch:number;
  roll:number;
  time: Date;
}

const schema = new Schema<IVehicleAccidentStatus>({
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  speed: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  pitch: { type: Number, required: true },
  roll: { type: Number, required: true },

  time: { type: Date, required: true, default: Date.now, index: true },
});

schema.plugin(auditPlugin);

export const VehicleAccidentStatus = model<IVehicleAccidentStatus>(
  "VehicleAccidentStatus",
  schema
);