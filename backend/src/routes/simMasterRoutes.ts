import express from 'express'
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { simMasterSchema } from '../validators/schemas';
import { simMasterController } from '../controllers/simMasterController';

const router = express.Router();

router.post("/" , authMiddleware , requireRole("ADMIN") , validateBody(simMasterSchema),simMasterController.create)
router.get("/",authMiddleware,simMasterController.list)
router.get("/:id",authMiddleware,simMasterController.byId)
router.put("/:id",authMiddleware,requireRole("ADMIN"),simMasterController.update)
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  simMasterController.remove
);

export default router