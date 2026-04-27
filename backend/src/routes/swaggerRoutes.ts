import { Router } from "express";

const router = Router();

router.get("/swagger.json", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: { title: "Vehicle Monitor API", version: "1.0.0" },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths: {
      "/auth/login": { post: { summary: "Login" } },
      "/auth/passcode": { post: { summary: "Generate passcode" } },
      "/auth/reset-password": { post: { summary: "Reset password" } },
      "/users": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/users/{id}": { get: { security: [{ bearerAuth: [] }] }, put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/bases": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/bases/{id}": { get: { security: [{ bearerAuth: [] }] }, put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/locations": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/locations/{id}": { get: { security: [{ bearerAuth: [] }] }, put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/vehicles": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/vehicles/{id}": { get: { security: [{ bearerAuth: [] }] }, put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/vehicle-locations": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/vehicle-locations/latest/{vehicleId}": { get: { security: [{ bearerAuth: [] }] } },
      "/vehicle-locations/analytics/{vehicleId}": { get: { security: [{ bearerAuth: [] }] } },
      "/vehicle-locations/timeline": { get: { security: [{ bearerAuth: [] }] } },
      "/devices": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/devices/{id}": { put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/geofences": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/geofences/{id}": { put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/sims": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/sims/{id}": { put: { security: [{ bearerAuth: [] }] }, delete: { security: [{ bearerAuth: [] }] } },
      "/device-sim-mapping": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/device-sim-mapping/{id}": { delete: { security: [{ bearerAuth: [] }] } },
      "/api/sos": { get: { security: [{ bearerAuth: [] }] }, post: { security: [{ bearerAuth: [] }] } },
      "/api/sos/close/{id}": { put: { security: [{ bearerAuth: [] }] } },
      "/notifications/speed-exceeded": { post: { security: [{ bearerAuth: [] }] } },
      "/notifications/harsh-braking": { post: { security: [{ bearerAuth: [] }] } },
      "/notifications/geofence-enter": { post: { security: [{ bearerAuth: [] }] } },
      "/notifications/geofence-exit": { post: { security: [{ bearerAuth: [] }] } },
      "/notifications/swagger.json": { get: { security: [{ bearerAuth: [] }] } }
    },
  });
});

export default router;
