import { Router } from "express";
import { createUser, deleteUser, getUserById, listUsers, updateUser } from "../controllers/userController";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", createUser);
router.get("/", listUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
