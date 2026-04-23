import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IBase extends Document, AuditFields {
  name: string;
  location: { latitude: number; longitude: number };
  address: { state: string; country: string; city: string; pincode: string };
  geofenceId?: Schema.Types.ObjectId;
  locationId: Schema.Types.ObjectId;
  baseunitid?: string;
  baseunitcode?: string;
  baseunitname?: string;
  baseunitnumber?: string;
  countrycode?: string;
  statecode?: string;
  active?: string;
}

const schema = new Schema<IBase>({
  name: { type: String, required: true, trim: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  address: {
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India" },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true }
  },
  geofenceId: { type: Schema.Types.ObjectId, ref: "Geofence", required: false },
  locationId: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  baseunitid: { type: String, trim: true },
  baseunitcode: { type: String, trim: true },
  baseunitname: { type: String, trim: true },
  baseunitnumber: { type: String, trim: true },
  countrycode: { type: String, trim: true },
  statecode: { type: String, trim: true },
  active: { type: String, trim: true, default: "1" }
});

schema.plugin(auditPlugin);

export const Base = model<IBase>("Base", schema);
