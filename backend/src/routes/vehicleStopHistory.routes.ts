import { Router } from "express";
import { vehicleStopHistoryController } from "../controllers/vehicleStopHistory.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleStopHistoryController.list(req, res)
  )
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleStopHistoryController.byId(req, res)
  )
);

export default router;