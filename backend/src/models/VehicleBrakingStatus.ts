import { Document, Schema, model } from "mongoose";
import { auditPlugin } from "../plugins/auditPlugin";
import { AuditFields } from "./audit";

export interface IVehicleBrakingStatus extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  speed: number;
  latitude: number;
  longitude: number;
  time: Date;
}

const schema = new Schema<IVehicleBrakingStatus>({
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  speed: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  time: { type: Date, required: true, default: Date.now, index: true },
});

schema.plugin(auditPlugin);

export const VehicleBrakingStatus = model<IVehicleBrakingStatus>("VehicleBrakingStatus", schema);
