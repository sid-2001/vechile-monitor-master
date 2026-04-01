import { Router } from "express";
import { vehicleLocationController } from "../controllers/vehicleLocationController";

const router = Router();

/**
 * @swagger
 * /api/vehicle-locations:
 *   post:
 *     summary: Create vehicle location
 *     tags: [VehicleLocations]
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     summary: List vehicle locations
 *     tags: [VehicleLocations]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", vehicleLocationController.create);
router.get("/", vehicleLocationController.list);

/**
 * @swagger
 * /api/vehicle-locations/{id}:
 *   get:
 *     summary: Get vehicle location by id
 *     tags: [VehicleLocations]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Update vehicle location
 *     tags: [VehicleLocations]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete vehicle location
 *     tags: [VehicleLocations]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", vehicleLocationController.getById);
router.put("/:id", vehicleLocationController.update);
router.delete("/:id", vehicleLocationController.remove);

export default router;
