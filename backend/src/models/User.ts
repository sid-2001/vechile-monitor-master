import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IUser extends Document, AuditFields {
  username: string;
  displayName: string;
  password: string;
  role: "ADMIN" | "OPERATOR";
  baseId: Schema.Types.ObjectId;
  failedAttempts: number;
  isLocked: boolean;
  passcode?: string;
  isActive: boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "OPERATOR"], default: "OPERATOR" },
    baseId: { type: Schema.Types.ObjectId, ref: "Base", required: true },
    failedAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    passcode: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: false }
);

userSchema.plugin(auditPlugin);

export const User = model<IUser>("User", userSchema);
