import { Router } from "express";
import { roleController } from "../controllers/role.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { roleSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(roleSchema), asyncHandler((req, res) => roleController.create(req, res)));
router.get("/", asyncHandler((req, res) => roleController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => roleController.byId(req, res)));
router.put("/:id", validateBody(roleSchema), asyncHandler((req, res) => roleController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => roleController.remove(req, res)));
export default router;
