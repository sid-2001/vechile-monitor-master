import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

export interface IVehicleLocation extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  deviceId: string;
  time: Date;
  latitude: number;
  longitude: number;
  location: GeoPoint;
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
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0],
    },
  },
  elevation: Number,
  angle: Number,
  speed: { type: Number, default: 0 },
  ignition: { type: Boolean, default: false },
  source: { type: String, enum: ["live", "simulation"], default: "live", index: true }
});

schema.index({ location: "2dsphere" });

schema.pre("validate", function setLocation(next) {
  this.location = {
    type: "Point",
    coordinates: [Number(this.longitude || 0), Number(this.latitude || 0)],
  };
  next();
});

schema.plugin(auditPlugin);

export const VehicleLocation = model<IVehicleLocation>("VehicleLocation", schema);
