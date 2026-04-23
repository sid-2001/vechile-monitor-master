import express from "express";
import { deviceSimMappingController } from "../controllers/deviceSimMappingController";

const router = express.Router();

router.post("/", deviceSimMappingController.create);
router.get("/", deviceSimMappingController.list);
router.put("/:id", deviceSimMappingController.update);
router.delete("/:id", deviceSimMappingController.remove);

export default router;