import { Router } from "express";
import { baseController } from "../controllers/base.controller";
import { validateBody } from "../middleware/validationMiddleware";
import { baseSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(baseSchema), (req, res) => baseController.create(req, res));
router.get("/", (req, res) => baseController.list(req, res));
router.get("/:id", (req, res) => baseController.byId(req, res));
router.put("/:id", (req, res) => baseController.update(req, res));
router.delete("/:id", (req, res) => baseController.remove(req, res));
export default router;
