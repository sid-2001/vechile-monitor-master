import { Router } from "express";
import { vehicleHaltConfigController } from "../controllers/vehicleHaltConfig.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { vehicleHaltConfigSchema } from "../validators/schemas";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateBody(vehicleHaltConfigSchema),
  asyncHandler((req, res) =>
    vehicleHaltConfigController.create(req, res)
  )
);

router.get(
  "/",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleHaltConfigController.list(req, res)
  )
);

router.get(
  "/vehicle/:vehicleId",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleHaltConfigController.byVehicleId(req, res)
  )
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleHaltConfigController.byId(req, res)
  )
);

router.put(
  "/:id",
  authMiddleware,
  validateBody(vehicleHaltConfigSchema),
  asyncHandler((req, res) =>
    vehicleHaltConfigController.update(req, res)
  )
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) =>
    vehicleHaltConfigController.remove(req, res)
  )
);

export default router;