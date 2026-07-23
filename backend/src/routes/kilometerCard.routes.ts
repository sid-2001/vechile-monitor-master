// import { Router } from 'express'
// import kilometerCardController from '../controllers/kilometerCard.controller'
// import { authMiddleware } from '../middleware/authMiddleware'

// const router = Router()

// router.post(
//   '/',
//   kilometerCardController.createKilometerCard.bind(
//     kilometerCardController
//   )
// )

// router.get(
//   '/',
//   kilometerCardController.getKilometerCards.bind(
//     kilometerCardController
//   )
// )

// router.get(
//   '/vehicle/:vehicleId/:year/:month',
//   kilometerCardController.getKilometerCardByVehicleMonth.bind(
//     kilometerCardController
//   )
// )

// router.get(
//   '/:id',
//   kilometerCardController.getKilometerCardById.bind(
//     kilometerCardController
//   )
// )

// router.get(
//   '/report/:vehicleId/:year/:month',
//   authMiddleware,
//   kilometerCardController.downloadKilometerCardReport
// )

// router.put(
//   '/:id',
//   kilometerCardController.updateKilometerCard.bind(
//     kilometerCardController
//   )
// )

// router.put(
//   '/:id/daily-entry',
//   kilometerCardController.updateDailyEntry.bind(
//     kilometerCardController
//   )
// )

// router.delete(
//   '/:id/daily-entry/:date',
//   kilometerCardController.deleteDailyEntry.bind(
//     kilometerCardController
//   )
// )

// router.delete(
//   '/:id',
//   kilometerCardController.deleteKilometerCard.bind(
//     kilometerCardController
//   )
// )

// export default router


import { Router } from 'express'
import kilometerCardController from '../controllers/kilometerCard.controller'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.post(
  '/',
  kilometerCardController.createKilometerCard.bind(
    kilometerCardController
  )
)

router.get(
  '/',
  kilometerCardController.getKilometerCards.bind(
    kilometerCardController
  )
)

router.get(
  '/vehicle/:vehicleId/:year/:month',
  kilometerCardController.getKilometerCardByVehicleMonth.bind(
    kilometerCardController
  )
)

// MONTHLY REPORT
router.get(
  '/report/:vehicleId/:year/:month',
  authMiddleware,
  kilometerCardController.downloadKilometerCardReport.bind(
    kilometerCardController
  )
)

// 6 MONTH REPORT
router.get(
  '/report/half-year/:vehicleId/:year/:month',
  authMiddleware,
  kilometerCardController.downloadHalfYearReport.bind(
    kilometerCardController
  )
)

// KEEP DYNAMIC ID ROUTE AFTER SPECIFIC ROUTES
router.get(
  '/:id',
  kilometerCardController.getKilometerCardById.bind(
    kilometerCardController
  )
)

router.put(
  '/:id',
  kilometerCardController.updateKilometerCard.bind(
    kilometerCardController
  )
)

router.put(
  '/:id/daily-entry',
  kilometerCardController.updateDailyEntry.bind(
    kilometerCardController
  )
)

router.delete(
  '/:id/daily-entry/:date',
  kilometerCardController.deleteDailyEntry.bind(
    kilometerCardController
  )
)

router.delete(
  '/:id',
  kilometerCardController.deleteKilometerCard.bind(
    kilometerCardController
  )
)

export default router