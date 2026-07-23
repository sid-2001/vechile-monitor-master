import { Request, Response } from 'express'
import kilometerCardService from '../services/kilometerCard.service'
import { generateKilometerCardReport } from '../services/kilometerCardReport.service'
import { generateKilometerCardHalfYearReport } from '../services/kilometerCardHalfYearReport.service'

class KilometerCardController {
  async createKilometerCard(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const kilometerCard =
        await kilometerCardService.createKilometerCard(req.body)

      res.status(201).json({
        success: true,
        message: 'Kilometer card created successfully',
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error.message || 'Failed to create kilometer card',
      })
    }
  }

  async getKilometerCards(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const kilometerCards =
        await kilometerCardService.getKilometerCards()

      res.status(200).json({
        success: true,
        data: kilometerCards,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message:
          error.message || 'Failed to fetch kilometer cards',
      })
    }
  }

  async getKilometerCardById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params

      const kilometerCard =
        await kilometerCardService.getKilometerCardById(id)

      if (!kilometerCard) {
        res.status(404).json({
          success: false,
          message: 'Kilometer card not found',
        })

        return
      }

      res.status(200).json({
        success: true,
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message:
          error.message || 'Failed to fetch kilometer card',
      })
    }
  }

  async getKilometerCardByVehicleMonth(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { vehicleId, year, month } = req.params

      const kilometerCard =
        await kilometerCardService.getKilometerCardByVehicleMonth(
          vehicleId,
          Number(year),
          Number(month)
        )

      if (!kilometerCard) {
        res.status(404).json({
          success: false,
          message:
            'Kilometer card not found for selected vehicle and month',
        })

        return
      }

      res.status(200).json({
        success: true,
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message:
          error.message || 'Failed to fetch kilometer card',
      })
    }
  }

  async updateKilometerCard(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params

      const kilometerCard =
        await kilometerCardService.updateKilometerCard(
          id,
          req.body
        )

      if (!kilometerCard) {
        res.status(404).json({
          success: false,
          message: 'Kilometer card not found',
        })

        return
      }

      res.status(200).json({
        success: true,
        message: 'Kilometer card updated successfully',
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error.message || 'Failed to update kilometer card',
      })
    }
  }

  async updateDailyEntry(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params

      const kilometerCard =
        await kilometerCardService.updateDailyEntry(
          id,
          req.body
        )

      res.status(200).json({
        success: true,
        message: 'Daily entry saved successfully',
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error.message || 'Failed to save daily entry',
      })
    }
  }

  async deleteDailyEntry(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id, date } = req.params

      const kilometerCard =
        await kilometerCardService.deleteDailyEntry(
          id,
          Number(date)
        )

      res.status(200).json({
        success: true,
        message: 'Daily entry deleted successfully',
        data: kilometerCard,
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error.message || 'Failed to delete daily entry',
      })
    }
  }

  async deleteKilometerCard(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params

      const kilometerCard =
        await kilometerCardService.deleteKilometerCard(id)

      if (!kilometerCard) {
        res.status(404).json({
          success: false,
          message: 'Kilometer card not found',
        })

        return
      }

      res.status(200).json({
        success: true,
        message: 'Kilometer card deleted successfully',
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message:
          error.message || 'Failed to delete kilometer card',
      })
    }


    
  }

  async downloadHalfYearReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { vehicleId, year, month } = req.params

    await generateKilometerCardHalfYearReport(
      vehicleId,
      Number(month),
      Number(year),
      res
    )
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        message:
          error.message ||
          'Failed to generate six month kilometer card report',
      })
    }
  }
}

  async downloadKilometerCardReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { vehicleId, year, month } = req.params

    if (!vehicleId || !year || !month) {
      res.status(400).json({
        success: false,
        message: 'Vehicle ID, year and month are required',
      })

      return
    }

    const parsedYear = Number(year)
    const parsedMonth = Number(month)

    if (
      Number.isNaN(parsedYear) ||
      Number.isNaN(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid year or month',
      })

      return
    }

    await generateKilometerCardReport(
      vehicleId,
      parsedMonth,
      parsedYear,
      res
    )
  } catch (error: any) {
    console.error(
      'Download Kilometer Card Report Error:',
      error
    )

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to generate kilometer card report',
      })
    }
  }
}
  
}


export default new KilometerCardController()