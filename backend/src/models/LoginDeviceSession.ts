import mongoose, { Document, Schema } from "mongoose";

export interface ILoginDeviceSession extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  role: "ADMIN" | "DRIVER" | "OPERATOR";
  tokenId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  timezone?: string;
  lastLoginTime: Date;
  lastSeenAt: Date;
  loggedOutAt?: Date | null;
  logoutReason?: "self" | "admin" | "all" | null;
  active: boolean;
}

const loginDeviceSessionSchema = new Schema<ILoginDeviceSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    username: { type: String, required: true, index: true },
    role: { type: String, enum: ["ADMIN", "DRIVER", "OPERATOR"], required: true },
    tokenId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
    timezone: { type: String },
    lastLoginTime: { type: Date, required: true, default: Date.now, index: true },
    lastSeenAt: { type: Date, required: true, default: Date.now },
    loggedOutAt: { type: Date, default: null },
    logoutReason: { type: String, enum: ["self", "admin", "all", null], default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const LoginDeviceSession =
  mongoose.models.LoginDeviceSession ||
  mongoose.model<ILoginDeviceSession>("LoginDeviceSession", loginDeviceSessionSchema);
