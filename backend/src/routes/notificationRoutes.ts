import { Router } from "express";
import { emitGeofenceAlert, emitVehicleHarshBrakingAlert, emitVehicleSpeedAlert } from "../socket/vehicle.socket";

const router = Router();

/**
 * @openapi
 * /notifications/speed-exceeded:
 *   post:
 *     summary: Publish speed exceeded notification
 */
router.post("/speed-exceeded", (req, res) => {
  const payload = req.body;
  emitVehicleSpeedAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    speed: Number(payload.speed),
    maxSpeed: Number(payload.maxSpeed),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Speed exceeded notification emitted", payload });
});

router.post("/harsh-braking", (req, res) => {
  const payload = req.body;
  emitVehicleHarshBrakingAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    previousSpeed: Number(payload.previousSpeed),
    speed: Number(payload.speed),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Harsh braking notification emitted", payload });
});

router.post("/geofence-enter", (req, res) => {
  const payload = req.body;
  emitGeofenceAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    geofenceName: String(payload.geofenceName),
    eventType: "enter",
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Geofence enter notification emitted", payload });
});

router.post("/geofence-exit", (req, res) => {
  const payload = req.body;
  emitGeofenceAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    geofenceName: String(payload.geofenceName),
    eventType: "exit",
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Geofence exit notification emitted", payload });
});

router.get("/swagger.json", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: { title: "Notification API", version: "1.0.0" },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    paths: {
      "/notifications/speed-exceeded": {
        post: {
          summary: "Speed exceeded notification",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["vehicleId", "vehicleNumber", "speed", "maxSpeed", "latitude", "longitude"], properties: {
            vehicleId: { type: "string" }, vehicleNumber: { type: "string" }, speed: { type: "number" }, maxSpeed: { type: "number" }, latitude: { type: "number" }, longitude: { type: "number" }, time: { type: "string", format: "date-time" }, source: { type: "string", enum: ["live", "simulation"] }
          } } } } },
          responses: { "201": { description: "Notification emitted" } }
        }
      },
      "/notifications/harsh-braking": {
        post: {
          summary: "Harsh braking notification",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["vehicleId", "vehicleNumber", "previousSpeed", "speed", "latitude", "longitude"], properties: {
            vehicleId: { type: "string" }, vehicleNumber: { type: "string" }, previousSpeed: { type: "number" }, speed: { type: "number" }, latitude: { type: "number" }, longitude: { type: "number" }, time: { type: "string", format: "date-time" }, source: { type: "string", enum: ["live", "simulation"] }
          } } } } },
          responses: { "201": { description: "Notification emitted" } }
        }
      },
      "/notifications/geofence-enter": {
        post: {
          summary: "Geofence enter notification",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["vehicleId", "vehicleNumber", "geofenceName"], properties: {
            vehicleId: { type: "string" }, vehicleNumber: { type: "string" }, geofenceName: { type: "string" }, time: { type: "string", format: "date-time" }, source: { type: "string", enum: ["live", "simulation"] }
          } } } } },
          responses: { "201": { description: "Notification emitted" } }
        }
      },
      "/notifications/geofence-exit": {
        post: {
          summary: "Geofence exit notification",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["vehicleId", "vehicleNumber", "geofenceName"], properties: {
            vehicleId: { type: "string" }, vehicleNumber: { type: "string" }, geofenceName: { type: "string" }, time: { type: "string", format: "date-time" }, source: { type: "string", enum: ["live", "simulation"] }
          } } } } },
          responses: { "201": { description: "Notification emitted" } }
        }
      }
    }
  });
});

export default router;
