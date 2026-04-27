import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Types } from "mongoose";

import { vehicleLocationService } from "../services/vehicleLocation.service";
import { vehicleService, VehicleService } from "../services/vehicle.service";
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

const HARSH_BRAKING_MIN_PREVIOUS_SPEED = 5;
const HARSH_BRAKING_MAX_CURRENT_SPEED = 0;

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
const processVehicleEvents = async (saved: any, vehicleDoc: any,vehicleNumber:any) => {

  try {


    console.log(vehicleNumber);

    const [previous, geofences] = await Promise.all([
      // FIX 1: Fetch the location strictly BEFORE the current point in time
      VehicleLocation.findOne({
        vehicleId: saved.vehicleId,
        time: { $lt: saved.time }, 
      }).sort({ time: -1 }),

      Geofence.find({}, { _id: 1, name: 1, center: 1, radius: 1 }).lean(),
    ]);

    /* ---------------- GEOFENCE ---------------- */
    for (const fence of geofences) {
      if (!fence.center || !fence.radius) continue;

      const currentDistance = getDistanceMeters(saved, fence.center);
      
      // FIX 2: Prevent faulty "exits" if distance calculation fails
      if (isNaN(currentDistance) || currentDistance === null) {
        console.error("Distance is NaN! Check if 'saved' has valid coordinates:", saved);
        continue; 
      }

      const currentlyInside = currentDistance <= fence.radius;

      // Handle first point ever tracked
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
            vehicleNumber: String(vehicleNumber),
            geofenceName: fence.name,
            eventType: "enter",
            time: saved.time,
          });
        }
        continue;
      }

      const prevDistance = getDistanceMeters(previous, fence.center);
      const previouslyInside = prevDistance <= fence.radius;

      // Check for state change
      if (previouslyInside !== currentlyInside) {
        const eventType = currentlyInside ? "enter" : "exit";

        await GeofenceLog.create({
          vehicleId: saved.vehicleId,
          geofenceId: fence._id,
          geofenceName: fence.name,
          eventType,
          // Note: You might want to conditionally name this based on eventType in your schema later!
          enter_time: saved.time, 
          latitude: saved.latitude,
          longitude: saved.longitude,
          speed: saved.speed,
        });

        emitGeofenceAlert({
          vehicleId: String(saved.vehicleId),
          geofenceName: fence.name,
          vehicleNumber: String(vehicleNumber),
          eventType,
          time: saved.time,
        });
      }
    }
    /* ---------------- SPEED ---------------- */
    const maxSpeed = Number(vehicleDoc?.performance?.maxSpeed || 0);

    if (maxSpeed > 0 && saved.speed >= maxSpeed) {
      console.log(saved)
      await VehicleSpeedStatus.create({
        vehicleId: saved.vehicleId,
        speed: saved.speed,
        latitude: saved.latitude,
           vehicleNumber:String(vehicleNumber),
        longitude: saved.longitude,
        time: saved.time,
      });

      emitVehicleSpeedAlert({
        vehicleId: String(saved.vehicleId),
        speed: saved.speed,
        maxSpeed,
        vehicleNumber:String(vehicleNumber),
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
      console.log("Saved In Harsh braking",JSON.stringify(saved));
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
        vehicleNumber:vehicleNumber,
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
        await  vehicleService.byId (doc.vehicleId);
       
       
      // await processVehicleEvents(doc, vehicleDoc,vehicleDoc?.vehicleNumber);
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