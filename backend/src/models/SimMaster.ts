import mongoose, { Schema, Document } from "mongoose";

export interface ISimMaster extends Document {
  simid: string; 
  simnumber?: string;
  phonenumber?: string;
  iccidnumber?: string;
  operator?: string;
  expirydate?: Date; 
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

const SimMasterSchema: Schema = new Schema(
  {
    simid: { type: String, required: true, unique: true, index: true },

    simnumber: { type: String, required: true, index: true },

    phonenumber: {
      type: String,
      match: /^\d{10}$/
    },

    iccidnumber: {
      type: String,
      match: /^\d{19,20}$/ 
    },

    operator: {
      type: String,
      enum: ["JIO", "AIRTEL", "VI", "BSNL"], 
      uppercase: true
    },

    expirydate: {
      type: Date
    },

    countrycode: { type: String },
    statecode: { type: String },
    locationid: { type: String },
    baseunitid: { type: String },

    active: { type: Boolean, default: true },

    createdby: { type: String },
    createdlocaldatetime: { type: Date },
    createdoffset: { type: String },
    createdtimezone: { type: String },
    createdutcdatetime: { type: Date },

    modifiedby: { type: String },
    modifiedlocaldatetime: { type: Date },
    modifiedoffset: { type: String },
    modifiedtimezone: { type: String },
    modifiedutcdatetime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISimMaster>("SimMaster", SimMasterSchema);