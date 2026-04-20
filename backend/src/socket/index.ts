import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Types } from "mongoose";

import { vehicleLocationService } from "../services/vehicleLocation.service";
import { VehicleLocation } from "../models/VehicleLocation";
import { Geofence } from "../models/Geofence";
import { GeofenceLog } from "../models/GeofenceLog";
import { VehicleSpeedStatus } from "../models/VehicleSpeedStatus";
import { VehicleBrakingStatus } from "../models/VehicleBrakingStatus";

import {
  emitGeofenceAlert,
  emitVehicleSpeedAlert,
  emitVehicleHarshBrakingAlert,
} from "./vehicle.socket";

let io: Server;
let globalVehicleBroadcastInterval: NodeJS.Timeout | null = null;

const HARSH_BRAKING_MIN_PREVIOUS_SPEED = 40;
const HARSH_BRAKING_MAX_CURRENT_SPEED = 10;

/* -------------------------------------------------- */
/* 🧠 DISTANCE CALCULATOR */
/* -------------------------------------------------- */
const getDistanceMeters = (p1: any, p2: any): number => {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const lat1 = (p1.latitude * Math.PI) / 180;
  const lat2 = (p2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* -------------------------------------------------- */
/* 🚧 GEOFENCE + SPEED + BRAKING ENGINE */
/* -------------------------------------------------- */
const processVehicleEvents = async (saved: any, vehicleDoc: any) => {
  try {
    const [previous, geofences] = await Promise.all([
      VehicleLocation.findOne({
        vehicleId: saved.vehicleId,
        _id: { $ne: saved._id },
      }).sort({ time: -1 }),

      Geofence.find({}, { _id: 1, name: 1, center: 1, radius: 1 }).lean(),
    ]);

    /* ---------------- GEOFENCE ---------------- */
    for (const fence of geofences) {
      if (!fence.center || !fence.radius) continue;

      const currentDistance = getDistanceMeters(saved, fence.center);
      const currentlyInside = currentDistance <= fence.radius;

      if (!previous) {
        if (currentlyInside) {
          await GeofenceLog.create({
            vehicleId: saved.vehicleId,
            geofenceId: fence._id,
            geofenceName: fence.name,
            eventType: "enter",
            enter_time: saved.time,
            latitude: saved.latitude,
            longitude: saved.longitude,
            speed: saved.speed,
          });

          emitGeofenceAlert({
            vehicleId: String(saved.vehicleId),
            geofenceName: fence.name,
            eventType: "enter",
            time: saved.time,
          });
        }
        continue;
      }

      const prevDistance = getDistanceMeters(previous, fence.center);
      const previouslyInside = prevDistance <= fence.radius;

      if (previouslyInside !== currentlyInside) {
        const eventType = currentlyInside ? "enter" : "exit";

        await GeofenceLog.create({
          vehicleId: saved.vehicleId,
          geofenceId: fence._id,
          geofenceName: fence.name,
          eventType,
          enter_time: saved.time,
          latitude: saved.latitude,
          longitude: saved.longitude,
          speed: saved.speed,
        });

        emitGeofenceAlert({
          vehicleId: String(saved.vehicleId),
          geofenceName: fence.name,
          eventType,
          time: saved.time,
        });
      }
    }

    /* ---------------- SPEED ---------------- */
    const maxSpeed = Number(vehicleDoc?.performance?.maxSpeed || 0);

    if (maxSpeed > 0 && saved.speed >= maxSpeed) {
      await VehicleSpeedStatus.create({
        vehicleId: saved.vehicleId,
        speed: saved.speed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });

      emitVehicleSpeedAlert({
        vehicleId: String(saved.vehicleId),
        speed: saved.speed,
        maxSpeed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });
    }

    /* ---------------- HARSH BRAKING ---------------- */
    if (
      previous &&
      previous.speed >= HARSH_BRAKING_MIN_PREVIOUS_SPEED &&
      saved.speed <= HARSH_BRAKING_MAX_CURRENT_SPEED
    ) {
      await VehicleBrakingStatus.create({
        vehicleId: saved.vehicleId,
        speed: saved.speed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });

      emitVehicleHarshBrakingAlert({
        vehicleId: String(saved.vehicleId),
        previousSpeed: previous.speed,
        speed: saved.speed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });
    }
  } catch (err) {
    console.error("❌ Event processing failed:", err);
  }
};

/* -------------------------------------------------- */
/* 🚀 SOCKET INIT */
/* -------------------------------------------------- */
export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    transports: ["websocket", "polling"],
    cors: { origin: "*" },
  });

  /* 🔁 GLOBAL LIVE VEHICLE BROADCAST */
  if (!globalVehicleBroadcastInterval) {
    globalVehicleBroadcastInterval = setInterval(async () => {
      try {
        const latestVehicles =
          await vehicleLocationService.getLatestLocationsOfAllVehicles();

        io.emit("vehicleLocationBulkUpdate", latestVehicles);
      } catch (err) {
        console.error("❌ SOCKET ERROR:", err);
      }
    }, 1000);
  }

  /* 🔌 CONNECTION */
  io.on("connection", (socket: any) => {
    console.log("✅ Client connected:", socket.id);

    /* -------------------------------------------------- */
    /* 📡 REALTIME VEHICLE STREAM + EVENT DETECTION */
    /* -------------------------------------------------- */
    const changeStream = VehicleLocation.watch([], {
      fullDocument: "updateLookup",
    });

    changeStream.on("change", async (change) => {
      if (change.operationType !== "insert") return;

      const doc = change.fullDocument;

      socket.emit("vehicleLocationUpdate", doc);

      // ⚡ Run event detection
      const vehicleDoc =
        await vehicleLocationService.getVehicleById(doc.vehicleId);

      await processVehicleEvents(doc, vehicleDoc);
    });

    socket.on("disconnect", async () => {
      console.log("❌ Client disconnected:", socket.id);
      await changeStream.close();
    });
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};