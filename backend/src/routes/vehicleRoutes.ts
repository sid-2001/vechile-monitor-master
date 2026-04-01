import { Router } from "express";
import { vehicleController } from "../controllers/vehicleController";

const router = Router();

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create vehicle
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     summary: List vehicles
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", vehicleController.create);
router.get("/", vehicleController.list);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by id
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", vehicleController.getById);
router.put("/:id", vehicleController.update);
router.delete("/:id", vehicleController.remove);

export default router;
