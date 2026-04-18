import { Types } from "mongoose";
import { VehicleLocation, IVehicleLocation } from "../models/VehicleLocation";
import { Geofence } from "../models/Geofence";
import { GeofenceLog } from "../models/GeofenceLog";
import { Vehicle } from "../models/Vehicle";
import { VehicleSpeedStatus } from "../models/VehicleSpeedStatus";
import { VehicleBrakingStatus } from "../models/VehicleBrakingStatus";
import {
  emitAllVehicleLocationUpdate,
  emitGeofenceAlert,
  emitVehicleHarshBrakingAlert,
  emitVehicleLocationUpdate,
  emitVehicleSpeedAlert,
} from "../socket/vehicle.socket";

const HARSH_BRAKING_MIN_PREVIOUS_SPEED = 20;
const HARSH_BRAKING_MAX_CURRENT_SPEED = 1;

export class VehicleLocationService {
  private getDistanceMeters(
    pointA: { latitude: number; longitude: number },
    pointB: { latitude: number; longitude: number }
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(pointB.latitude - pointA.latitude);
    const dLon = toRad(pointB.longitude - pointA.longitude);
    const lat1 = toRad(pointA.latitude);
    const lat2 = toRad(pointB.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async handleGeofenceEvents(saved: IVehicleLocation, vehicleNumber: string): Promise<void> {
    const [latestBeforeCurrent, geofences] = await Promise.all([
      VehicleLocation.findOne({ vehicleId: saved.vehicleId, _id: { $ne: saved._id } }).sort({ time: -1 }),
      Geofence.find({}, { _id: 1, name: 1, center: 1, radius: 1 }).lean(),
    ]);

    for (const fence of geofences) {
      if (!fence.center?.latitude || !fence.center?.longitude || !fence.radius) continue;

      const currentDistance = this.getDistanceMeters(
        { latitude: saved.latitude, longitude: saved.longitude },
        { latitude: fence.center.latitude, longitude: fence.center.longitude }
      );
      const currentlyInside = currentDistance <= fence.radius;

      if (!latestBeforeCurrent) {
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
            vehicleNumber,
            geofenceName: fence.name,
            eventType: "enter",
            time: saved.time,
          });
        }
        continue;
      }

      const previousDistance = this.getDistanceMeters(
        { latitude: latestBeforeCurrent.latitude, longitude: latestBeforeCurrent.longitude },
        { latitude: fence.center.latitude, longitude: fence.center.longitude }
      );
      const previouslyInside = previousDistance <= fence.radius;

      if (previouslyInside === currentlyInside) continue;

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
        vehicleNumber,
        geofenceName: fence.name,
        eventType,
        time: saved.time,
      });
    }
  }

  private async handleSpeedAndBrakingEvents(saved: IVehicleLocation, vehicleDoc: any, vehicleNumber: string): Promise<void> {
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
        vehicleNumber,
        speed: saved.speed,
        maxSpeed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });
    }

    const latestBeforeCurrent = await VehicleLocation.findOne({
      vehicleId: saved.vehicleId,
      _id: { $ne: saved._id },
    }).sort({ time: -1 });

    if (
      latestBeforeCurrent &&
      latestBeforeCurrent.speed >= HARSH_BRAKING_MIN_PREVIOUS_SPEED &&
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
        vehicleNumber,
        previousSpeed: latestBeforeCurrent.speed,
        speed: saved.speed,
        latitude: saved.latitude,
        longitude: saved.longitude,
        time: saved.time,
      });
    }
  }

  async create(payload: Partial<IVehicleLocation>, actor: string): Promise<any> {
    const doc = new VehicleLocation(payload);
    doc.$locals.currentUser = actor;

    const saved = await doc.save();

    const vehicleDoc = await Vehicle.findById(saved.vehicleId).lean();
    const vehicleNumber = vehicleDoc?.vehicleNumber || String(saved.vehicleId);

    await Promise.all([
      this.handleGeofenceEvents(saved, vehicleNumber),
      this.handleSpeedAndBrakingEvents(saved, vehicleDoc, vehicleNumber),
    ]);

    const latestVehicles = await this.getLatestLocationsOfAllVehicles();
    emitAllVehicleLocationUpdate(latestVehicles);

    emitVehicleLocationUpdate({
      vehicleId: String(saved.vehicleId),
      latitude: saved.latitude,
      longitude: saved.longitude,
      speed: saved.speed,
      ignition: saved.ignition,
      time: saved.time,
      source: saved.source || "live",
    });

    return saved;
  }

  async list(
    filter: Record<string, unknown>,
    options: { skip: number; limit: number; sort: Record<string, 1 | -1> }
  ) {
    const [items, total] = await Promise.all([
      VehicleLocation.find(filter)
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort),
      VehicleLocation.countDocuments(filter),
    ]);

    return { items, total };
  }

  latest(vehicleId: string) {
    return VehicleLocation.findOne({ vehicleId }).sort({ time: -1 });
  }

  async getAnalytics(vehicleId: string) {
    const [locations, geofenceLogs, speedLogs, brakingLogs] = await Promise.all([
      VehicleLocation.find({ vehicleId }).sort({ time: 1 }).lean(),
      GeofenceLog.find({ vehicleId }).sort({ enter_time: -1 }).lean(),
      VehicleSpeedStatus.find({ vehicleId }).sort({ time: -1 }).lean(),
      VehicleBrakingStatus.find({ vehicleId }).sort({ time: -1 }).lean(),
    ]);

    const totalSpeed = locations.reduce((sum, item) => sum + (item.speed || 0), 0);
    const avgSpeed = locations.length ? totalSpeed / locations.length : 0;

    let ignitionOnMs = 0;
    for (let i = 0; i < locations.length - 1; i += 1) {
      const current = locations[i];
      const next = locations[i + 1];
      if (current.ignition) {
        ignitionOnMs += Math.max(0, new Date(next.time).getTime() - new Date(current.time).getTime());
      }
    }

    const geofenceEnterCount = geofenceLogs.filter((item) => item.eventType === "enter").length;
    const geofenceExitCount = geofenceLogs.filter((item) => item.eventType === "exit").length;

    return {
      vehicleId,
      avgSpeed: Number(avgSpeed.toFixed(2)),
      geofenceEnterCount,
      geofenceExitCount,
      ignitionOnMinutes: Math.round(ignitionOnMs / 60000),
      harshBrakingCount: brakingLogs.length,
      overSpeedCount: speedLogs.length,
      geofenceLogs,
      speedLogs,
      brakingLogs,
    };
  }


  async getTimeline(params: {
    vehicleIds: string[];
    from: Date;
    to: Date;
    bucket: "month" | "week" | "day" | "hour" | "minute" | "second";
    binSize?: number;
    excludeSimulation?: boolean;
  }) {
    const matchStage: Record<string, unknown> = {
      vehicleId: { $in: params.vehicleIds.map((id) => new Types.ObjectId(id)) },
      time: { $gte: params.from, $lte: params.to },
    };

    if (params.excludeSimulation !== false) {
      matchStage.source = { $ne: "simulation" };
    }

    return VehicleLocation.aggregate([
      { $match: matchStage },
      { $sort: { vehicleId: 1, time: -1 } },
      {
        $group: {
          _id: {
            vehicleId: "$vehicleId",
            bucketTime: { $dateTrunc: { date: "$time", unit: params.bucket, binSize: params.binSize || 1 } },
          },
          vehicleId: { $first: "$vehicleId" },
          latitude: { $first: "$latitude" },
          longitude: { $first: "$longitude" },
          speed: { $first: "$speed" },
          ignition: { $first: "$ignition" },
          time: { $first: "$time" },
          source: { $first: "$source" },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleData",
        },
      },
      {
        $unwind: {
          path: "$vehicleData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          vehicleId: 1,
          vehicleNumber: "$vehicleData.vehicleNumber",
          latitude: 1,
          longitude: 1,
          speed: 1,
          ignition: 1,
          time: 1,
          source: 1,
          bucketTime: "$_id.bucketTime",
        },
      },
      { $sort: { bucketTime: 1 } },
      { $limit: 500000 },
    ]).allowDiskUse(true);
  }

  async getLatestLocationsOfAllVehicles() {
    return VehicleLocation.aggregate([
      { $sort: { vehicleId: 1, time: -1 } },
      {
        $group: {
          _id: "$vehicleId",
          vehicleId: { $first: "$vehicleId" },
          latitude: { $first: "$latitude" },
          longitude: { $first: "$longitude" },
          speed: { $first: "$speed" },
          ignition: { $first: "$ignition" },
          time: { $first: "$time" },
          angle: { $first: "$angle" },
          source: { $first: "$source" },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleData",
        },
      },
      {
        $unwind: {
          path: "$vehicleData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          vehicleNumber: "$vehicleData.vehicleNumber",
        },
      },
    ]).allowDiskUse(true);
  }
}

export const vehicleLocationService = new VehicleLocationService();
