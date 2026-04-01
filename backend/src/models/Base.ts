import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IBase extends Document, AuditFields {
  name: string;
  code: string;
  city: string;
  state: string;
  isActive: boolean;
}

const baseSchema = new Schema<IBase>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: false }
);

baseSchema.plugin(auditPlugin);

export const Base = model<IBase>("Base", baseSchema);
