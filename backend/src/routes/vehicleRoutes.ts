import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { validateBody } from "../middleware/validationMiddleware";
import { vehicleSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(vehicleSchema), (req, res) => vehicleController.create(req, res));
router.get("/", (req, res) => vehicleController.list(req, res));
router.get("/:id", (req, res) => vehicleController.byId(req, res));
router.put("/:id", (req, res) => vehicleController.update(req, res));
router.delete("/:id", (req, res) => vehicleController.remove(req, res));
export default router;
