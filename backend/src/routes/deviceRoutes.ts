import { Router } from "express";
import { deviceController } from "../controllers/device.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler((req, res) => deviceController.list(req, res)));
router.post("/", asyncHandler((req, res) => deviceController.create(req, res)));
router.put("/:id", asyncHandler((req, res) => deviceController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => deviceController.remove(req, res)));
router.put("/:id/link", asyncHandler((req, res) => deviceController.link(req, res)));

export default router;
