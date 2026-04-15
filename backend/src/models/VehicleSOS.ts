import mongoose, { Document, Schema } from "mongoose";


export interface IVehicleSOS extends Document {
  vehicleId: mongoose.Types.ObjectId;
  createdAt: Date;
  closedAt?: Date | null;
  closedBy?: mongoose.Types.ObjectId | null;
  status: "OPEN" | "CLOSED";
}


const vehicleSOSSchema: Schema<IVehicleSOS> = new Schema(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  {
    timestamps: true, 
  }
);


const VehicleSOS = mongoose.model<IVehicleSOS>(
  "VehicleSOS",
  vehicleSOSSchema
);

export default VehicleSOS;