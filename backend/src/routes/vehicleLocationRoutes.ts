import { Router } from "express";
import { vehicleLocationController } from "../controllers/vehicleLocation.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validationMiddleware";
import { vehicleLocationSchema } from "../validators/schemas";
import { getIo } from "../socket";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const io = getIo();
  const handler = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  io.on("vehicleLocationUpdate", handler);
  req.on("close", () => {
    io.off("vehicleLocationUpdate", handler);
    res.end();
  });
});
router.post("/", authMiddleware, validateBody(vehicleLocationSchema), asyncHandler((req, res) => vehicleLocationController.create(req, res)));
router.get("/", authMiddleware, asyncHandler((req, res) => vehicleLocationController.list(req, res)));
router.get("/latest/:vehicleId", authMiddleware, asyncHandler((req, res) => vehicleLocationController.latest(req, res)));
router.post("/cache", authMiddleware, validateBody(vehicleLocationSchema), asyncHandler((req, res) => vehicleLocationController.cacheLocation(req, res)));
router.get("/live/:vehicleId", authMiddleware, asyncHandler((req, res) => vehicleLocationController.liveFromCache(req, res)));
router.get("/vector-history/:vehicleId", authMiddleware, asyncHandler((req, res) => vehicleLocationController.vectorTileHistory(req, res)));
router.get("/analytics/:vehicleId", authMiddleware, asyncHandler((req, res) => vehicleLocationController.analytics(req, res)));
router.get("/timeline", authMiddleware, asyncHandler((req, res) => vehicleLocationController.timeline(req, res)));
export default router;
