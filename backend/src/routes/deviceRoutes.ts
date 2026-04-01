import { Router } from "express";
import { deviceController } from "../controllers/device.controller";

const router = Router();

router.get("/", (req, res) => deviceController.list(req, res));
router.post("/", (req, res) => deviceController.create(req, res));
router.put("/:id", (req, res) => deviceController.update(req, res));
router.delete("/:id", (req, res) => deviceController.remove(req, res));
router.put("/:id/link", (req, res) => deviceController.link(req, res));

export default router;
