import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { vehicleLocationController } from "../controllers/vehicleLocation.controller";

const router = Router();

router.get("/:z/:x/:y.pbf", asyncHandler((req, res) => vehicleLocationController.vectorTilePbf(req, res)));

export default router;
