import KilometerCard, {
  IKilometerCard,
  IKilometerCardDailyEntry,
} from '../models/KilometerCard'

interface CreateKilometerCardData {
  vehicleId: string
  vehicleNo: string
  nomenclature: string
  balanceInTank: number
  targetAsPerWorkshop: number
  targetKplAsPerAo: number
  year: number
  month: number
  dailyEntries?: IKilometerCardDailyEntry[]
  balanceFuelInTank?: number
  totalFuelConsumed?: number
  totalFuelConsumedStaticEngineDuty?: number
  totalFuelConsumedIdling?: number
  totalKmsRun?: number
  kplAchieved?: number
}

interface UpdateDailyEntryData {
  date: number
  dailyMileageIncludingAmenity?: number
  sr?: number
  trg?: number
  fuelDrawnPol?: number
  fuelDrawnEngineOil?: number
}

class KilometerCardService {
 async createKilometerCard(
  data: CreateKilometerCardData
): Promise<IKilometerCard> {
  const existingCard = await KilometerCard.findOne({
    vehicleId: data.vehicleId,
    year: data.year,
    month: data.month,
  })

  if (existingCard) {
    throw new Error(
      'Kilometer card already exists for this vehicle, year and month'
    )
  }

  // Previous month and year calculate karo
  let previousMonth = data.month - 1
  let previousYear = data.year

  // January ke case me previous month December hoga
  if (previousMonth === 0) {
    previousMonth = 12
    previousYear = data.year - 1
  }

  // Same vehicle ka previous month kilometer card find karo
  const previousKilometerCard = await KilometerCard.findOne({
    vehicleId: data.vehicleId,
    year: previousYear,
    month: previousMonth,
  })

  // Previous month ka closing balance current month ka opening balance hoga
  if (previousKilometerCard) {
    data.balanceInTank =
      previousKilometerCard.balanceFuelInTank
  }

  const kilometerCard = await KilometerCard.create(data)

  return kilometerCard
}
  async getKilometerCards(): Promise<IKilometerCard[]> {
    return KilometerCard.find()
      .populate('vehicleId')
      .sort({
        year: -1,
        month: -1,
        createdAt: -1,
      })
  }

  async getKilometerCardById(
    id: string
  ): Promise<IKilometerCard | null> {
    return KilometerCard.findById(id).populate('vehicleId')
  }

  async getKilometerCardByVehicleMonth(
    vehicleId: string,
    year: number,
    month: number
  ): Promise<IKilometerCard | null> {
    return KilometerCard.findOne({
      vehicleId,
      year,
      month,
    }).populate('vehicleId')
  }

  async updateKilometerCard(
    id: string,
    data: Partial<IKilometerCard>
  ): Promise<IKilometerCard | null> {
    return KilometerCard.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    )
  }

  async updateDailyEntry(
    id: string,
    entryData: UpdateDailyEntryData
  ): Promise<IKilometerCard | null> {
    const kilometerCard = await KilometerCard.findById(id)

    if (!kilometerCard) {
      throw new Error('Kilometer card not found')
    }

    const existingEntryIndex =
      kilometerCard.dailyEntries.findIndex(
        (entry) => entry.date === entryData.date
      )

    if (existingEntryIndex !== -1) {
      kilometerCard.dailyEntries[existingEntryIndex] = {
        ...kilometerCard.dailyEntries[existingEntryIndex],
        ...entryData,
      }
    } else {
      kilometerCard.dailyEntries.push({
        date: entryData.date,
        dailyMileageIncludingAmenity:
          entryData.dailyMileageIncludingAmenity ?? 0,
        sr: entryData.sr ?? 0,
        trg: entryData.trg ?? 0,
        fuelDrawnPol: entryData.fuelDrawnPol ?? 0,
        fuelDrawnEngineOil:
          entryData.fuelDrawnEngineOil ?? 0,
      })
    }

    kilometerCard.dailyEntries.sort(
      (a, b) => a.date - b.date
    )

    await kilometerCard.save()

    return kilometerCard
  }

  async deleteDailyEntry(
    id: string,
    date: number
  ): Promise<IKilometerCard | null> {
    const kilometerCard = await KilometerCard.findById(id)

    if (!kilometerCard) {
      throw new Error('Kilometer card not found')
    }

    kilometerCard.dailyEntries =
      kilometerCard.dailyEntries.filter(
        (entry) => entry.date !== date
      )

    await kilometerCard.save()

    return kilometerCard
  }

  async deleteKilometerCard(
    id: string
  ): Promise<IKilometerCard | null> {
    return KilometerCard.findByIdAndDelete(id)
  }
}

export default new KilometerCardService()