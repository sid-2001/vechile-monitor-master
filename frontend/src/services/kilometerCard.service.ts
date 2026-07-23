import api1 from './apis/api1'

export interface KilometerCardDailyEntry {
  date: number
  dailyMileageIncludingAmenity: number
  sr: number
  trg: number
  fuelDrawnPol: number
  fuelDrawnEngineOil: number
}

export interface KilometerCardData {
  _id?: string

  vehicleId: string
  vehicleNo: string
  nomenclature: string

  balanceInTank: number
  targetAsPerWorkshop: number
  targetKplAsPerAo: number

  year: number
  month: number

  dailyEntries: KilometerCardDailyEntry[]

  balanceFuelInTank: number
  totalFuelConsumed: number
  totalFuelConsumedStaticEngineDuty: number
  totalFuelConsumedIdling: number
  totalKmsRun: number
  kplAchieved: number

  createdAt?: string
  updatedAt?: string
}

class KilometerCardService {
  async createKilometerCard(data: KilometerCardData) {
    return await api1.post('/kilometer-cards', data)
  }

  async getKilometerCards() {
    return await api1.get('/kilometer-cards')
  }

  async getKilometerCardById(id: string) {
    return await api1.get(`/kilometer-cards/${id}`)
  }

  async getKilometerCardByVehicleMonth(
    vehicleId: string,
    year: number,
    month: number
  ) {
    return await api1.get(
      `/kilometer-cards/vehicle/${vehicleId}/${year}/${month}`
    )
  }

  async updateKilometerCard(
    id: string,
    data: Partial<KilometerCardData>
  ) {
    return await api1.put(
      `/kilometer-cards/${id}`,
      data
    )
  }

  async updateDailyEntry(
    id: string,
    data: KilometerCardDailyEntry
  ) {
    return await api1.put(
      `/kilometer-cards/${id}/daily-entry`,
      data
    )
  }

  async deleteDailyEntry(
    id: string,
    date: number
  ) {
    return await api1.del(
      `/kilometer-cards/${id}/daily-entry/${date}`
    )
  }
  async downloadReport(
  vehicleId: string,
  year: number,
  month: number
) {
  return await api1.instance.get(
    `/kilometer-cards/report/${vehicleId}/${year}/${month}`,
    {
      responseType: 'blob',
    }
  )
}

async downloadHalfYearReport(
  vehicleId: string,
  year: number,
  month: number
) {
  return await api1.instance.get(
    `/kilometer-cards/report/half-year/${vehicleId}/${year}/${month}`,
    {
      responseType: 'blob',
    }
  )
}

  async deleteKilometerCard(id: string) {
    return await api1.del(
      `/kilometer-cards/${id}`
    )
  }
  
}

const kilometerCardService = new KilometerCardService()

export default kilometerCardService