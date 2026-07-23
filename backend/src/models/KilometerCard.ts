import mongoose, { Document, Schema } from 'mongoose'

export interface IKilometerCardDailyEntry {
  date: number
dailyMileageIncludingAmenity: number
  sr: number
  trg: number
  fuelDrawnPol: number
  fuelDrawnEngineOil: number
}

export interface IKilometerCard extends Document {
  vehicleId: mongoose.Types.ObjectId

  vehicleNo: string
  nomenclature: string
  balanceInTank: number
  targetAsPerWorkshop: number
  targetKplAsPerAo: number

  year: number
  month: number

  dailyEntries: IKilometerCardDailyEntry[]

  balanceFuelInTank: number
  totalFuelConsumed: number
  totalFuelConsumedStaticEngineDuty: number
  totalFuelConsumedIdling: number
  totalKmsRun: number
  kplAchieved: number

  createdAt: Date
  updatedAt: Date
}

const KilometerCardDailyEntrySchema =
  new Schema<IKilometerCardDailyEntry>(
    {
      date: {
        type: Number,
        required: true,
        min: 1,
        max: 31,
      },

      dailyMileageIncludingAmenity: {
        type: Number,
        default: 0,
      },

      sr: {
        type: Number,
        default: 0,
      },

      trg: {
        type: Number,
        default: 0,
      },

      fuelDrawnPol: {
        type: Number,
        default: 0,
      },

      fuelDrawnEngineOil: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  )

const KilometerCardSchema = new Schema<IKilometerCard>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },

    vehicleNo: {
      type: String,
      required: true,
      trim: true,
    },

    nomenclature: {
      type: String,
      required: true,
      trim: true,
    },

    balanceInTank: {
      type: Number,
      required: true,
      default: 0,
    },

    targetAsPerWorkshop: {
      type: Number,
      required: true,
      default: 0,
    },

    targetKplAsPerAo: {
      type: Number,
      required: true,
      default: 0,
    },

    year: {
      type: Number,
      required: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    dailyEntries: {
      type: [KilometerCardDailyEntrySchema],
      default: [],
    },

    balanceFuelInTank: {
      type: Number,
      default: 0,
    },

    totalFuelConsumed: {
      type: Number,
      default: 0,
    },

    totalFuelConsumedStaticEngineDuty: {
      type: Number,
      default: 0,
    },

    totalFuelConsumedIdling: {
      type: Number,
      default: 0,
    },

    totalKmsRun: {
      type: Number,
      default: 0,
    },

    kplAchieved: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

KilometerCardSchema.index(
  {
    vehicleId: 1,
    year: 1,
    month: 1,
  },
  {
    unique: true,
  }
)

export default mongoose.model<IKilometerCard>(
  'KilometerCard',
  KilometerCardSchema
)