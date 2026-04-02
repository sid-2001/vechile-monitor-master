import { Router } from "express";
import { vehicleLocationController } from "../controllers/vehicleLocation.controller";
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
router.post("/", authMiddleware, validateBody(vehicleLocationSchema), (req, res) => vehicleLocationController.create(req, res));
router.get("/", authMiddleware, (req, res) => vehicleLocationController.list(req, res));
router.get("/latest/:vehicleId", authMiddleware, (req, res) => vehicleLocationController.latest(req, res));
export default router;
