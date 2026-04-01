import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { validateBody } from "../middleware/validationMiddleware";
import { userSchema } from "../validators/schemas";

const router = Router();
router.post("/", validateBody(userSchema), (req, res) => userController.create(req, res));
router.get("/", (req, res) => userController.list(req, res));
router.get("/:id", (req, res) => userController.byId(req, res));
router.put("/:id", (req, res) => userController.update(req, res));
router.delete("/:id", (req, res) => userController.remove(req, res));
export default router;
