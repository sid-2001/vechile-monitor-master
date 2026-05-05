import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IVehicleLocation extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  deviceId: string;
  time: Date;
  latitude: number;
  longitude: number;
  elevation?: number;
  angle?: number;
  speed: number;
  ignition: boolean;
  source?: "live" | "simulation";
}

const schema = new Schema<IVehicleLocation>({
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  deviceId: { type: String, required: true },
  time: { type: Date, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation: Number,
  angle: Number,
  speed: { type: Number, default: 0 },
  ignition: { type: Boolean, default: false },
  source: { type: String, enum: ["live", "simulation"], default: "live", index: true }
});

schema.plugin(auditPlugin);

// export const VehicleLocationHistory = model<IVehicleLocation>("vehicle_coordinates_history", schema);
export const VehicleLocationHistory = model<IVehicleLocation>(
  "VehicleLocationHistory",           
  schema,
  "vehicle_coordinates_history"      
);
