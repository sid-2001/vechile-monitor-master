import { Router } from "express";
import { geofenceController } from "../controllers/geofence.controller";
import { validateBody } from "../middleware/validationMiddleware";
import { geofenceSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(geofenceSchema), (req, res) => geofenceController.create(req, res));
router.get("/", (req, res) => geofenceController.list(req, res));
router.get("/:id", (req, res) => geofenceController.byId(req, res));
router.put("/:id", (req, res) => geofenceController.update(req, res));
router.delete("/:id", (req, res) => geofenceController.remove(req, res));

export default router;
