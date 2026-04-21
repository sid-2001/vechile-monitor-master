import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IVehicle extends Document, AuditFields {
  vehicleId: string;
  vehicleNumber: string;
  licensePlate: string;
  type: string;
  subType: string;
  manufacturer: { name: string; model: string; variant: string };
  manufacturing: { year: number; fuelType: string; engineNumber: string; chassisNumber: string };
  physical: {
    color: string;
    category: string;
    dimensions: { length: number; width: number; height: number; unit: string };
    loadCapacity: number;
    axles: number;
  };
  performance: { transmissionType: string; fuelTankCapacity: number; maxSpeed: number; minSpeed: number };
  deviceId: string;
  baseId: Schema.Types.ObjectId;
  driverId?: Schema.Types.ObjectId;
  onSOS: boolean;
  lastSeen: { type: Date, default: null }, live:{ type: Boolean, default: false },

  status: { isActive: boolean; lastSOS?: { time: Date; location: { lat: number; lng: number } } };
}

const schema = new Schema<IVehicle>({
  vehicleId: { type: String, unique: true, index: true },
  vehicleNumber: { type: String, required: true, unique: true },
  licensePlate: { type: String, required: true },
  type: { type: String, required: true },
  subType: { type: String, required: true },
  manufacturer: { name: String, model: String, variant: String },
  manufacturing: { year: Number, fuelType: String, engineNumber: String, chassisNumber: String },
  physical: {
    color: String,
    category: String,
    dimensions: { length: Number, width: Number, height: Number, unit: String },
    loadCapacity: Number,
    axles: Number
  },
  performance: { transmissionType: String, fuelTankCapacity: Number, maxSpeed: Number, minSpeed: Number },
  deviceId: { type: String, required: true },
  baseId: { type: Schema.Types.ObjectId, ref: "Base", required: true },
  driverId: { type: Schema.Types.ObjectId, ref: "User" },
  onSOS: { type: Boolean, default: false },
  status: {
    isActive: { type: Boolean, default: true },
    lastSOS: { time: Date, location: { lat: Number, lng: Number } }
  }
});

schema.pre("save", function (next) {
  if (!this.vehicleId) {
    this.vehicleId = `VH-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
  }
  
  next();
});

schema.plugin(auditPlugin);

export const Vehicle = model<IVehicle>("Vehicle", schema);
