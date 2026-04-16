import { Document, model, Schema, Types } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IGeofence extends Document, AuditFields {
  name: string;
  baseId: Types.ObjectId;
  center: { latitude: number; longitude: number };
  radius: number;
}

const schema = new Schema<IGeofence>({
  name: { type: String, required: true, trim: true },
  baseId: { type: Schema.Types.ObjectId, ref: "Base", required: true, index: true },
  center: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, required: true, min: 1 }
});

schema.plugin(auditPlugin);

export const Geofence = model<IGeofence>("Geofence", schema);
