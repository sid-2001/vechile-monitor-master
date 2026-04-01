import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { loginSchema, passcodeSchema, resetSchema } from "../validators/schemas";

const router = Router();
router.post("/login", validateBody(loginSchema), (req, res) => authController.login(req, res));
router.post("/passcode", authMiddleware, requireRole("ADMIN"), validateBody(passcodeSchema), (req, res) => authController.generatePasscode(req, res));
router.post("/reset-password", validateBody(resetSchema), (req, res) => authController.resetPassword(req, res));

export default router;
