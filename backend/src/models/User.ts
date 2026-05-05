import { Document, model, Schema } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";
import mongoose from "mongoose";
delete mongoose.models.User;
export type UserRole = "ADMIN" | "DRIVER" | "OPERATOR";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface IUser extends Document, AuditFields {
  username: string;
  password: string;
  name: { first: string; middle?: string; last: string };
  gender?: string;
  dob?: Date;
  contact: { phonecode?: string; mobile: string; email: string };
  role: UserRole;
  baseId?: Schema.Types.ObjectId;
  baseIds: Schema.Types.ObjectId[];
  failedAttempts: number;
  status: UserStatus;
  lastLoginTime?: Date;
  firstLoggedIn: boolean;
  temporaryPasscode?: string;
  deviceipaddress?: string;
  devicename?: string;
  countrycode?: string;
  statecode?: string;
  district?: string;
  zipcode?: string;
  locationid?: Schema.Types.ObjectId;
  baseunitid?: string;
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
    phonecode: { type: String },
    mobile: { type: String, required: true },
    email: { type: String, required: true }
  },
  role: { type: String, enum: ["ADMIN", "DRIVER", "OPERATOR"], default: "OPERATOR" },
  baseId: { type: Schema.Types.ObjectId, ref: "Base", required: false },
  baseIds: [{ type: Schema.Types.ObjectId, ref: "Base", required: true }],
  failedAttempts: { type: Number, default: 0 },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  lastLoginTime: { type: Date },
  firstLoggedIn: { type: Boolean, default: true },
  temporaryPasscode: { type: String },
  deviceipaddress: { type: String },
  devicename: { type: String },
  countrycode: { type: String },
  statecode: { type: String },
  district: { type: String },
  zipcode: { type: String },
  locationid: { type: Schema.Types.ObjectId, ref: "Location", required: false },
  baseunitid: { type: String },
});

schema.plugin(auditPlugin);
console.log("STATUS ENUM:", schema.path('status'));
console.log("ENUM VALUES:", schema.path('status'));

// export const User = model<IUser>("User", schema);
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", schema);