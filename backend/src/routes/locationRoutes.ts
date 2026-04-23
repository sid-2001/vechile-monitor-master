import { Router } from "express";
import { locationController } from "../controllers/location.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { locationSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(locationSchema), asyncHandler((req, res) => locationController.create(req, res)));
router.get("/", asyncHandler((req, res) => locationController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => locationController.byId(req, res)));
router.put("/:id", asyncHandler((req, res) => locationController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => locationController.remove(req, res)));

export default router;
