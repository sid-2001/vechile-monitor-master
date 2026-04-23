import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface ILocation extends Document, AuditFields {
  name: string;
  country: string;
  state: string;
  city: string;
}

const schema = new Schema<ILocation>({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
});

schema.plugin(auditPlugin);

export const Location = model<ILocation>("Location", schema);
