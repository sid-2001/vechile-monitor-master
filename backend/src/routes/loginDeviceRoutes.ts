import { Router } from "express";
import { loginDeviceController } from "../controllers/loginDevice.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireRole("ADMIN"), asyncHandler((req, res) => loginDeviceController.list(req, res)));
router.post("/logout-all", requireRole("ADMIN"), asyncHandler((req, res) => loginDeviceController.logoutAll(req, res)));
router.post("/:id/logout", requireRole("ADMIN"), asyncHandler((req, res) => loginDeviceController.logout(req, res)));

export default router;
