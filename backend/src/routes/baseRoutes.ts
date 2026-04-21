import { Router } from "express";
import { baseController } from "../controllers/base.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { baseSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(baseSchema), asyncHandler((req, res) => baseController.create(req, res)));
router.get("/", asyncHandler((req, res) => baseController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => baseController.byId(req, res)));
router.put("/:id", asyncHandler((req, res) => baseController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => baseController.remove(req, res)));
export default router;
