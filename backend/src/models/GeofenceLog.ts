import { Document, Schema, model } from "mongoose";
import { auditPlugin } from "../plugins/auditPlugin";
import { AuditFields } from "./audit";

export interface IGeofenceLog extends Document, AuditFields {
  vehicleId: Schema.Types.ObjectId;
  geofenceId: Schema.Types.ObjectId;
  geofenceName: string;
  eventType: "enter" | "exit";
  enter_time: Date;
  latitude: number;
  longitude: number;
  speed: number;
}

const schema = new Schema<IGeofenceLog>({
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  geofenceId: { type: Schema.Types.ObjectId, ref: "Geofence", required: true, index: true },
  geofenceName: { type: String, required: true },
  eventType: { type: String, enum: ["enter", "exit"], required: true },
  enter_time: { type: Date, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, required: true, default: 0 },
});

schema.plugin(auditPlugin);

export const GeofenceLog = model<IGeofenceLog>("GeofenceLog", schema);
