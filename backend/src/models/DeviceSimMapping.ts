import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceSimMapping extends Document {
  devicesimmapid: string;
  deviceid: mongoose.Types.ObjectId;
  simid: mongoose.Types.ObjectId;

  countrycode?: string;
  statecode?: string;
  locationid?: string;
  baseunitid?: string;

  active?: boolean;

  createdby?: string;
  createdlocaldatetime?: Date;
  createdoffset?: string;
  createdtimezone?: string;
  createdutcdatetime?: Date;

  modifiedby?: string;
  modifiedlocaldatetime?: Date;
  modifiedoffset?: string;
  modifiedtimezone?: string;
  modifiedutcdatetime?: Date;
}

const schema = new Schema<IDeviceSimMapping>({
  devicesimmapid: { type: String, required: true, unique: true },

  deviceid: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  simid: { type: Schema.Types.ObjectId, ref: "SimMaster", required: true },

  countrycode: String,
  statecode: String,
  locationid: String,
  baseunitid: String,

  active: { type: Boolean, default: true },

  createdby: String,
  createdlocaldatetime: Date,
  createdoffset: String,
  createdtimezone: String,
  createdutcdatetime: Date,

  modifiedby: String,
  modifiedlocaldatetime: Date,
  modifiedoffset: String,
  modifiedtimezone: String,
  modifiedutcdatetime: Date,
}, { timestamps: true });

export default mongoose.model<IDeviceSimMapping>("DeviceSimMapping", schema);