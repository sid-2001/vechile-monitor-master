import { Router } from "express";
import { createSOS, closeSOS } from "../controllers/vehicleSOS.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/create", asyncHandler(createSOS));
router.put("/close/:id", authMiddleware, asyncHandler(closeSOS));

export default router;
