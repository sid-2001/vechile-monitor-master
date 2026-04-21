import { Router } from "express";
import { geofenceController } from "../controllers/geofence.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { geofenceSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(geofenceSchema), asyncHandler((req, res) => geofenceController.create(req, res)));
router.get("/", asyncHandler((req, res) => geofenceController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => geofenceController.byId(req, res)));
router.put("/:id", asyncHandler((req, res) => geofenceController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => geofenceController.remove(req, res)));

export default router;
