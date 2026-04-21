import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { vehicleSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(vehicleSchema), asyncHandler((req, res) => vehicleController.create(req, res)));
router.get("/", asyncHandler((req, res) => vehicleController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => vehicleController.byId(req, res)));
router.put("/:id", asyncHandler((req, res) => vehicleController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => vehicleController.remove(req, res)));
router.put("/:id/sos", asyncHandler((req, res) =>vehicleController.toggleSOS(req, res)));
export default router;
