import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IVehicleLocation extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  latitude: number;
  longitude: number;
  speed: number;
  locationTime: Date;
}

const vehicleLocationSchema = new Schema<IVehicleLocation>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    locationTime: { type: Date, required: true }
  },
  { timestamps: false }
);

vehicleLocationSchema.plugin(auditPlugin);

export const VehicleLocation = model<IVehicleLocation>("VehicleLocation", vehicleLocationSchema);
