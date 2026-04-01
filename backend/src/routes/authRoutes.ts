import { Router } from "express";
import { forgotPasswordController, login } from "../controllers/authController";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username/password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: JWT token
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Reset password using passcode
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, passcode, newPassword]
 *             properties:
 *               username: { type: string }
 *               passcode: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/forgot-password", forgotPasswordController);

export default router;
