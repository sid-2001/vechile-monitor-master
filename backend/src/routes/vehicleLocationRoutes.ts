import { Router } from "express";
import { vehicleLocationController } from "../controllers/vehicleLocation.controller";
import { validateBody } from "../middleware/validationMiddleware";
import { vehicleLocationSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(vehicleLocationSchema), (req, res) => vehicleLocationController.create(req, res));
router.get("/", (req, res) => vehicleLocationController.list(req, res));
router.get("/latest/:vehicleId", (req, res) => vehicleLocationController.latest(req, res));
export default router;
