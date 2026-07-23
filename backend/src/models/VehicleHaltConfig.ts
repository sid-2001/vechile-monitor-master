import { Document, model, Schema, Types } from "mongoose";
import { AuditFields } from "./audit";
import { auditPlugin } from "../plugins/auditPlugin";

export interface IVehicleHaltConfig extends Document, AuditFields {
  vehicleId: Types.ObjectId;

  dayHalt: {
    enabled: boolean;
    windowStartTime: string;
    windowEndTime: string;
    minimumDurationMinutes: number;
  };

  nightHalt: {
    enabled: boolean;
    windowStartTime: string;
    windowEndTime: string;
    minimumDurationMinutes: number;
  };

  detection: {
    stationaryRadiusMeters: number;
    stationarySpeedThreshold: number;
    stationaryConfirmationPackets: number;
    movementConfirmationPackets: number;
    maxPacketGapSeconds: number;
    gpsJumpSpeedMultiplier: number;
  };
}

const haltRuleSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    windowStartTime: {
      type: String,
      required: true,
    },

    windowEndTime: {
      type: String,
      required: true,
    },

    minimumDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const detectionSchema = new Schema(
  {
    stationaryRadiusMeters: {
      type: Number,
      required: true,
      min: 1,
    },

    stationarySpeedThreshold: {
      type: Number,
      required: true,
      min: 0,
    },

    stationaryConfirmationPackets: {
      type: Number,
      required: true,
      min: 1,
    },

    movementConfirmationPackets: {
      type: Number,
      required: true,
      min: 1,
    },

    maxPacketGapSeconds: {
      type: Number,
      required: true,
      min: 1,
    },

    gpsJumpSpeedMultiplier: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const schema = new Schema<IVehicleHaltConfig>({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
    unique: true,
    index: true,
  },

  dayHalt: {
    type: haltRuleSchema,
    required: true,
  },

  nightHalt: {
    type: haltRuleSchema,
    required: true,
  },

  detection: {
    type: detectionSchema,
    required: true,
  },
});

schema.plugin(auditPlugin);

export const VehicleHaltConfig = model<IVehicleHaltConfig>(
  "VehicleHaltConfig",
  schema
);