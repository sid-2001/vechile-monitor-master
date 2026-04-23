import { Router } from "express";
import { GeofenceLog } from "../models/GeofenceLog";
import { VehicleBrakingStatus } from "../models/VehicleBrakingStatus";
import { VehicleSpeedStatus } from "../models/VehicleSpeedStatus";
import { emitGeofenceAlert, emitVehicleHarshBrakingAlert, emitVehicleSpeedAlert } from "../socket/vehicle.socket";

const router = Router();

router.post("/speed-exceeded", async (req, res) => {
  const payload = req.body;
  const saved = await VehicleSpeedStatus.create({
    vehicleId: payload.vehicleId,
    speed: Number(payload.speed),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    time: payload.time ? new Date(payload.time) : new Date(),
  });

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
  res.status(201).json({ message: "Speed exceeded notification emitted", saved });
});

router.post("/harsh-braking", async (req, res) => {
  const payload = req.body;
  const saved = await VehicleBrakingStatus.create({
    vehicleId: payload.vehicleId,
    speed: Number(payload.speed),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    time: payload.time ? new Date(payload.time) : new Date(),
  });

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
  res.status(201).json({ message: "Harsh braking notification emitted", saved });
});

router.post("/geofence-enter", async (req, res) => {
  const payload = req.body;
  if (!payload.geofenceId) {
    return res.status(422).json({ message: "geofenceId is required" });
  }

  const log = await GeofenceLog.create({
    vehicleId: payload.vehicleId,
    geofenceId: payload.geofenceId,
    geofenceName: String(payload.geofenceName),
    eventType: "enter",
    enter_time: payload.time ? new Date(payload.time) : new Date(),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    speed: Number(payload.speed || 0),
  });

  emitGeofenceAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    geofenceName: String(payload.geofenceName),
    eventType: "enter",
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Geofence enter notification emitted", saved: log });
});

router.post("/geofence-exit", async (req, res) => {
  const payload = req.body;
  if (!payload.geofenceId) {
    return res.status(422).json({ message: "geofenceId is required" });
  }

  const log = await GeofenceLog.create({
    vehicleId: payload.vehicleId,
    geofenceId: payload.geofenceId,
    geofenceName: String(payload.geofenceName),
    eventType: "exit",
    enter_time: payload.time ? new Date(payload.time) : new Date(),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    speed: Number(payload.speed || 0),
  });

  emitGeofenceAlert({
    vehicleId: String(payload.vehicleId),
    vehicleNumber: String(payload.vehicleNumber),
    geofenceName: String(payload.geofenceName),
    eventType: "exit",
    time: payload.time ? new Date(payload.time) : new Date(),
    source: payload.source || "live",
  });
  res.status(201).json({ message: "Geofence exit notification emitted", saved: log });
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
      "/notifications/speed-exceeded": { post: { summary: "Speed exceeded notification", security: [{ bearerAuth: [] }] } },
      "/notifications/harsh-braking": { post: { summary: "Harsh braking notification", security: [{ bearerAuth: [] }] } },
      "/notifications/geofence-enter": { post: { summary: "Geofence enter notification", security: [{ bearerAuth: [] }] } },
      "/notifications/geofence-exit": { post: { summary: "Geofence exit notification", security: [{ bearerAuth: [] }] } }
    }
  });
});

export default router;
