import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IBase extends Document, AuditFields {
  name: string;
  location: { latitude: number; longitude: number };
  address: { state: string; country: string; city: string; pincode: string };
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
  }
});

schema.plugin(auditPlugin);

export const Base = model<IBase>("Base", schema);
