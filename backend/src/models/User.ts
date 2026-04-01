import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export type UserRole = "ADMIN" | "DRIVER" | "OPERATOR";
export type UserStatus = "ACTIVE" | "LOCKED";

export interface IUser extends Document, AuditFields {
  username: string;
  password: string;
  name: { first: string; middle?: string; last: string };
  gender?: string;
  dob?: Date;
  contact: { mobile: string; email: string };
  role: UserRole;
  baseId: Schema.Types.ObjectId;
  failedAttempts: number;
  status: UserStatus;
  lastLoginTime?: Date;
  firstLoggedIn: boolean;
  temporaryPasscode?: string;
}

const schema = new Schema<IUser>({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  name: {
    first: { type: String, required: true },
    middle: { type: String },
    last: { type: String, required: true }
  },
  gender: { type: String },
  dob: { type: Date },
  contact: {
    mobile: { type: String, required: true },
    email: { type: String, required: true }
  },
  role: { type: String, enum: ["ADMIN", "DRIVER", "OPERATOR"], default: "OPERATOR" },
  baseId: { type: Schema.Types.ObjectId, ref: "Base", required: true },
  failedAttempts: { type: Number, default: 0 },
  status: { type: String, enum: ["ACTIVE", "LOCKED"], default: "ACTIVE" },
  lastLoginTime: { type: Date },
  firstLoggedIn: { type: Boolean, default: true },
  temporaryPasscode: { type: String }
});

schema.plugin(auditPlugin);

export const User = model<IUser>("User", schema);
