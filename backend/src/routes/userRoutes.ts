import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { userSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(userSchema), asyncHandler((req, res) => userController.create(req, res)));
router.get("/", asyncHandler((req, res) => userController.list(req, res)));
router.get("/:id", asyncHandler((req, res) => userController.byId(req, res)));
router.put("/:id", asyncHandler((req, res) => userController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => userController.remove(req, res)));
export default router;
