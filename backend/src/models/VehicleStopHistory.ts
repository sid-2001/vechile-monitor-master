import { Document, model, Schema, Types } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export type StopClassification =
  | "STOP"
  | "DAY_HALT"
  | "NIGHT_HALT"
  | "DAY_AND_NIGHT_HALT";

export type StopCompletionReason =
  | "MOVEMENT_CONFIRMED"
  | "ENTERED_GEOFENCE"
  | "DATA_GAP"
  | "SYSTEM_CLOSED";

export interface IVehicleStopHistory extends Document, AuditFields {
  vehicleId: Types.ObjectId;

  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;

  anchorLocation: {
    latitude: number;
    longitude: number;
  };

  lastLocation: {
    latitude: number;
    longitude: number;
  };

  geofenceId?: Types.ObjectId | null;

  isOutsideAssignedGeofence: boolean;

  dayDurationSeconds: number;
  nightDurationSeconds: number;

  dayHaltQualified: boolean;
  nightHaltQualified: boolean;

  classification: StopClassification;

  ignitionAtStart?: boolean | null;
  ignitionAtEnd?: boolean | null;

  minimumSpeed?: number | null;
  maximumSpeed?: number | null;

  gpsPacketCount: number;

  hasDataGap: boolean;
  dataGapSeconds: number;

  completionReason: StopCompletionReason;

  detectionVersion: string;
}

const locationSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const schema = new Schema<IVehicleStopHistory>({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
    index: true,
  },

  startedAt: {
    type: Date,
    required: true,
    index: true,
  },

  endedAt: {
    type: Date,
    required: true,
    index: true,
  },

  durationSeconds: {
    type: Number,
    required: true,
    min: 0,
  },

  anchorLocation: {
    type: locationSchema,
    required: true,
  },

  lastLocation: {
    type: locationSchema,
    required: true,
  },

  geofenceId: {
    type: Schema.Types.ObjectId,
    ref: "Geofence",
    default: null,
  },

  isOutsideAssignedGeofence: {
    type: Boolean,
    default: true,
  },

  dayDurationSeconds: {
    type: Number,
    default: 0,
  },

  nightDurationSeconds: {
    type: Number,
    default: 0,
  },

  dayHaltQualified: {
    type: Boolean,
    default: false,
    index: true,
  },

  nightHaltQualified: {
    type: Boolean,
    default: false,
    index: true,
  },

  classification: {
    type: String,
    enum: [
      "STOP",
      "DAY_HALT",
      "NIGHT_HALT",
      "DAY_AND_NIGHT_HALT",
    ],
    default: "STOP",
    index: true,
  },

  ignitionAtStart: {
    type: Boolean,
    default: null,
  },

  ignitionAtEnd: {
    type: Boolean,
    default: null,
  },

  minimumSpeed: {
    type: Number,
    default: null,
  },

  maximumSpeed: {
    type: Number,
    default: null,
  },

  gpsPacketCount: {
    type: Number,
    default: 0,
  },

  hasDataGap: {
    type: Boolean,
    default: false,
  },

  dataGapSeconds: {
    type: Number,
    default: 0,
  },

  completionReason: {
    type: String,
    enum: [
      "MOVEMENT_CONFIRMED",
      "ENTERED_GEOFENCE",
      "DATA_GAP",
      "SYSTEM_CLOSED",
    ],
    required: true,
  },

  detectionVersion: {
    type: String,
    default: "v1",
  },
});

schema.index({
  vehicleId: 1,
  startedAt: -1,
});

schema.index({
  vehicleId: 1,
  classification: 1,
  startedAt: -1,
});

schema.plugin(auditPlugin);

export const VehicleStopHistory = model<IVehicleStopHistory>(
  "VehicleStopHistory",
  schema
);