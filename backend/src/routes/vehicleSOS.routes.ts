import { Router } from "express";
import { createSOS, closeSOS } from "../controllers/vehicleSOS.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/create", createSOS);
router.put("/close/:id", authMiddleware, closeSOS);

export default router;