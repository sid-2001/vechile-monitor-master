import { Document, model, Schema, Types } from "mongoose";

export type VehicleMovementState =
  | "UNKNOWN"
  | "POSSIBLE_STOP"
  | "STATIONARY"
  | "POSSIBLE_MOVEMENT"
  | "MOVING";

export interface IVehicleStopState extends Document {
  vehicleId: Types.ObjectId;

  movementState: VehicleMovementState;

  anchorLocation?: {
    latitude: number;
    longitude: number;
  };

  lastLocation?: {
    latitude: number;
    longitude: number;
  };

  candidateStartedAt?: Date | null;
  stopStartedAt?: Date | null;
  stationaryConfirmedAt?: Date | null;
  lastPacketTime?: Date | null;

  stationaryPacketCount: number;
  movementPacketCount: number;
  gpsPacketCount: number;

  minimumSpeed?: number | null;
  maximumSpeed?: number | null;

  ignitionAtStart?: boolean | null;
  lastIgnition?: boolean | null;

  geofenceId?: Types.ObjectId | null;
  isOutsideAssignedGeofence: boolean;

  hasDataGap: boolean;
  dataGapSeconds: number;

  lastMovementReason?: string | null;
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

const schema = new Schema<IVehicleStopState>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      unique: true,
      index: true,
    },

    movementState: {
      type: String,
      enum: [
        "UNKNOWN",
        "POSSIBLE_STOP",
        "STATIONARY",
        "POSSIBLE_MOVEMENT",
        "MOVING",
      ],
      default: "UNKNOWN",
      index: true,
    },

    anchorLocation: {
      type: locationSchema,
      default: undefined,
    },

    lastLocation: {
      type: locationSchema,
      default: undefined,
    },

    candidateStartedAt: {
      type: Date,
      default: null,
    },

    stopStartedAt: {
      type: Date,
      default: null,
    },

    stationaryConfirmedAt: {
      type: Date,
      default: null,
    },

    lastPacketTime: {
      type: Date,
      default: null,
    },

    stationaryPacketCount: {
      type: Number,
      default: 0,
    },

    movementPacketCount: {
      type: Number,
      default: 0,
    },

    gpsPacketCount: {
      type: Number,
      default: 0,
    },

    minimumSpeed: {
      type: Number,
      default: null,
    },

    maximumSpeed: {
      type: Number,
      default: null,
    },

    ignitionAtStart: {
      type: Boolean,
      default: null,
    },

    lastIgnition: {
      type: Boolean,
      default: null,
    },

    geofenceId: {
      type: Schema.Types.ObjectId,
      ref: "Geofence",
      default: null,
    },

    isOutsideAssignedGeofence: {
      type: Boolean,
      default: false,
    },

    hasDataGap: {
      type: Boolean,
      default: false,
    },

    dataGapSeconds: {
      type: Number,
      default: 0,
    },

    lastMovementReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const VehicleStopState = model<IVehicleStopState>(
  "VehicleStopState",
  schema
);