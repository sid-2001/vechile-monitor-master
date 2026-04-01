import { Router } from "express";
import { baseController } from "../controllers/baseController";

const router = Router();

/**
 * @swagger
 * /api/bases:
 *   post:
 *     summary: Create base
 *     tags: [Bases]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, city, state]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               isActive: { type: boolean }
 *   get:
 *     summary: List bases
 *     tags: [Bases]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", baseController.create);
router.get("/", baseController.list);

/**
 * @swagger
 * /api/bases/{id}:
 *   get:
 *     summary: Get base by id
 *     tags: [Bases]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *   put:
 *     summary: Update base
 *     tags: [Bases]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete base
 *     tags: [Bases]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", baseController.getById);
router.put("/:id", baseController.update);
router.delete("/:id", baseController.remove);

export default router;
