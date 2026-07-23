// import { Types } from "mongoose";
import { IVehicleLocation } from "../models/VehicleLocation";
import { VehicleHaltConfig } from "../models/VehicleHaltConfig";
import { VehicleStopState } from "../models/VehicleStopState";
import {
  StopClassification,
  StopCompletionReason,
  VehicleStopHistory,
} from "../models/VehicleStopHistory";
import { Geofence } from "../models/Geofence";

export class HaltDetectionService {
  private getDistanceMeters(
    pointA: {
      latitude: number;
      longitude: number;
    },
    pointB: {
      latitude: number;
      longitude: number;
    }
  ): number {
    const toRad = (degree: number): number =>
      (degree * Math.PI) / 180;

    const earthRadius = 6371000;

    const latitudeDifference = toRad(
      pointB.latitude - pointA.latitude
    );

    const longitudeDifference = toRad(
      pointB.longitude - pointA.longitude
    );

    const latitudeA = toRad(pointA.latitude);
    const latitudeB = toRad(pointB.latitude);

    const value =
      Math.sin(latitudeDifference / 2) *
        Math.sin(latitudeDifference / 2) +
      Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2) *
        Math.cos(latitudeA) *
        Math.cos(latitudeB);

    const angularDistance =
      2 *
      Math.atan2(
        Math.sqrt(value),
        Math.sqrt(1 - value)
      );

    return earthRadius * angularDistance;
  }

  private isValidLocation(
    location: IVehicleLocation
  ): boolean {
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return false;
    }

    if (latitude < -90 || latitude > 90) {
      return false;
    }

    if (longitude < -180 || longitude > 180) {
      return false;
    }

    if (latitude === 0 && longitude === 0) {
      return false;
    }

    const time = new Date(location.time);

    if (Number.isNaN(time.getTime())) {
      return false;
    }

    return true;
  }

  private getCalculatedSpeedKmph(
    previousLocation: {
      latitude: number;
      longitude: number;
    },
    currentLocation: {
      latitude: number;
      longitude: number;
    },
    previousTime: Date,
    currentTime: Date
  ): number {
    const timeDifferenceSeconds =
      (currentTime.getTime() -
        previousTime.getTime()) /
      1000;

    if (timeDifferenceSeconds <= 0) {
      return 0;
    }

    const distanceMeters = this.getDistanceMeters(
      previousLocation,
      currentLocation
    );

    const metersPerSecond =
      distanceMeters / timeDifferenceSeconds;

    return metersPerSecond * 3.6;
  }

  private getWindowSeconds(
    stopStart: Date,
    stopEnd: Date,
    windowStartTime: string,
    windowEndTime: string
  ): number {
    if (stopEnd <= stopStart) {
      return 0;
    }

    const [startHour, startMinute] =
      windowStartTime.split(":").map(Number);

    const [endHour, endMinute] =
      windowEndTime.split(":").map(Number);

    let totalMilliseconds = 0;

    const currentDate = new Date(stopStart);

    currentDate.setHours(0, 0, 0, 0);

    const lastDate = new Date(stopEnd);

    lastDate.setHours(0, 0, 0, 0);

    currentDate.setDate(currentDate.getDate() - 1);

    while (currentDate <= lastDate) {
      const windowStart = new Date(currentDate);

      windowStart.setHours(
        startHour,
        startMinute,
        0,
        0
      );

      const windowEnd = new Date(currentDate);

      windowEnd.setHours(
        endHour,
        endMinute,
        0,
        0
      );

      if (windowEnd <= windowStart) {
        windowEnd.setDate(
          windowEnd.getDate() + 1
        );
      }

      const overlapStart = new Date(
        Math.max(
          stopStart.getTime(),
          windowStart.getTime()
        )
      );

      const overlapEnd = new Date(
        Math.min(
          stopEnd.getTime(),
          windowEnd.getTime()
        )
      );

      if (overlapEnd > overlapStart) {
        totalMilliseconds +=
          overlapEnd.getTime() -
          overlapStart.getTime();
      }

      currentDate.setDate(
        currentDate.getDate() + 1
      );
    }

    return Math.floor(totalMilliseconds / 1000);
  }

  private async closeStop(
    state: any,
    location: IVehicleLocation,
    config: any,
    completionReason: StopCompletionReason,
    actor: string
  ): Promise<void> {
    if (
      !state.stopStartedAt ||
      !state.anchorLocation
    ) {
      return;
    }

    const startedAt = new Date(
      state.stopStartedAt
    );

    const endedAt = new Date(location.time);

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (endedAt.getTime() -
          startedAt.getTime()) /
          1000
      )
    );

    const dayDurationSeconds =
      config.dayHalt.enabled
        ? this.getWindowSeconds(
            startedAt,
            endedAt,
            config.dayHalt.windowStartTime,
            config.dayHalt.windowEndTime
          )
        : 0;

    const nightDurationSeconds =
      config.nightHalt.enabled
        ? this.getWindowSeconds(
            startedAt,
            endedAt,
            config.nightHalt.windowStartTime,
            config.nightHalt.windowEndTime
          )
        : 0;

    const dayHaltQualified =
      config.dayHalt.enabled &&
      dayDurationSeconds >=
        Number(
          config.dayHalt.minimumDurationMinutes
        ) *
          60;

    const nightHaltQualified =
      config.nightHalt.enabled &&
      nightDurationSeconds >=
        Number(
          config.nightHalt.minimumDurationMinutes
        ) *
          60;

    let classification: StopClassification =
      "STOP";

    if (
      dayHaltQualified &&
      nightHaltQualified
    ) {
      classification = "DAY_AND_NIGHT_HALT";
    } else if (dayHaltQualified) {
      classification = "DAY_HALT";
    } else if (nightHaltQualified) {
      classification = "NIGHT_HALT";
    }

    const history = new VehicleStopHistory({
      vehicleId: state.vehicleId,

      startedAt,
      endedAt,

      durationSeconds,

      anchorLocation: state.anchorLocation,

      lastLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },

      geofenceId: state.geofenceId || null,

     isOutsideAssignedGeofence:
  state.isOutsideAssignedGeofence ?? true,

      dayDurationSeconds,
      nightDurationSeconds,

      dayHaltQualified,
      nightHaltQualified,

      classification,

      ignitionAtStart:
        state.ignitionAtStart ?? null,

      ignitionAtEnd:
        location.ignition ?? null,

      minimumSpeed:
        state.minimumSpeed ?? null,

      maximumSpeed:
        state.maximumSpeed ?? null,

      gpsPacketCount:
        state.gpsPacketCount || 0,

      hasDataGap:
        state.hasDataGap || false,

      dataGapSeconds:
        state.dataGapSeconds || 0,

      completionReason,

      detectionVersion: "v1",
    });

    history.$locals.currentUser = actor;

    await history.save();
  }

  private async resetState(
    state: any,
    location: IVehicleLocation,
    movementState:
      | "UNKNOWN"
      | "POSSIBLE_STOP"
      | "STATIONARY"
      | "POSSIBLE_MOVEMENT"
      | "MOVING",
    reason: string
  ): Promise<void> {
    state.movementState = movementState;

    state.anchorLocation = undefined;
    state.candidateStartedAt = null;
    state.stopStartedAt = null;
    state.stationaryConfirmedAt = null;

   state.stationaryPacketCount = 0;
state.movementPacketCount = 0;
state.gpsPacketCount = 0;

state.minimumSpeed = null;
state.maximumSpeed = null;

state.hasDataGap = false;
state.dataGapSeconds = 0;

state.ignitionAtStart = null;

    state.lastLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    state.lastPacketTime = location.time;
    state.lastIgnition = location.ignition;

    state.lastMovementReason = reason;

    await state.save();
  }

  async process(
    location: IVehicleLocation,
    vehicleDoc: any,
    actor: string
  ): Promise<void> {
    if (!this.isValidLocation(location)) {
      return;
    }

    const config =
      await VehicleHaltConfig.findOne({
        vehicleId: location.vehicleId,
      }).lean();

    if (!config) {
      return;
    }

   const assignedGeofences = await Geofence.find({
  baseId: vehicleDoc.baseId,
}).lean();

if (!assignedGeofences.length) {
  console.log(
    "HALT DETECTION SKIPPED: No assigned geofence found",
    {
      vehicleId: String(location.vehicleId),
      baseId: String(vehicleDoc?.baseId || ""),
    }
  );

  return;
}

let matchedGeofence: any = null;

const isInsideAssignedGeofence =
  assignedGeofences.some((geofence: any) => {
    if (
      !geofence.center ||
      geofence.center.latitude == null ||
      geofence.center.longitude == null ||
      geofence.radius == null
    ) {
      return false;
    }

    const distanceFromGeofence =
      this.getDistanceMeters(
        {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        },
        {
          latitude: Number(
            geofence.center.latitude
          ),
          longitude: Number(
            geofence.center.longitude
          ),
        }
      );

    const isInside =
      distanceFromGeofence <=
      Number(geofence.radius);

    if (isInside) {
      matchedGeofence = geofence;
    }

    return isInside;
  });

//     const assignedGeofence =
//       await Geofence.findOne({
//         baseId: vehicleDoc.baseId,
//       }).lean();

//    if (
//   !assignedGeofence ||
//   !assignedGeofence.center ||
//   assignedGeofence.center.latitude == null ||
//   assignedGeofence.center.longitude == null ||
//   assignedGeofence.radius == null
// ) {
//   console.log(
//     "HALT DETECTION SKIPPED: Invalid assigned geofence",
//     {
//       vehicleId: String(location.vehicleId),
//       baseId: vehicleDoc?.baseId,
//       geofenceId: assignedGeofence?._id,
//       center: assignedGeofence?.center,
//       radius: assignedGeofence?.radius,
//     }
//   );

//   return;
// }

    // const distanceFromGeofence =
    //   this.getDistanceMeters(
    //     {
    //       latitude: location.latitude,
    //       longitude: location.longitude,
    //     },
    //     {
    //       latitude:
    //         assignedGeofence.center.latitude,
    //       longitude:
    //         assignedGeofence.center.longitude,
    //     }
    //   );

    // const isInsideAssignedGeofence =
    //   distanceFromGeofence <=
    //   assignedGeofence.radius;

    let state =
      await VehicleStopState.findOne({
        vehicleId: location.vehicleId,
      });

    if (!state) {
      state = new VehicleStopState({
        vehicleId: location.vehicleId,

        movementState: "UNKNOWN",

        lastLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
        },

        lastPacketTime: location.time,

        lastIgnition: location.ignition,

        // geofenceId: assignedGeofence._id,

        // isOutsideAssignedGeofence:
        //   !isInsideAssignedGeofence,

       geofenceId:
  matchedGeofence?._id || null,

isOutsideAssignedGeofence:
  !isInsideAssignedGeofence,
      });

      await state.save();

      return;
    }
if (isInsideAssignedGeofence) {
  const hasActiveStop =
    (
      state.movementState === "STATIONARY" ||
      state.movementState === "POSSIBLE_MOVEMENT"
    ) &&
    state.stopStartedAt;

  if (hasActiveStop) {
    await this.closeStop(
      state,
      location,
      config,
      "ENTERED_GEOFENCE",
      actor
    );
  }

  state.geofenceId =
    matchedGeofence?._id || null;

  state.isOutsideAssignedGeofence = false;

  await this.resetState(
    state,
    location,
    "UNKNOWN",
    "INSIDE_ASSIGNED_GEOFENCE"
  );

  return;
}

state.geofenceId = null;
state.isOutsideAssignedGeofence = true;

    const currentTime = new Date(location.time);

    const previousTime = state.lastPacketTime
      ? new Date(state.lastPacketTime)
      : null;

    if (
      previousTime &&
      currentTime <= previousTime
    ) {
      return;
    }

    if (previousTime) {
      const packetGapSeconds =
        (currentTime.getTime() -
          previousTime.getTime()) /
        1000;

      if (
        packetGapSeconds >
        config.detection.maxPacketGapSeconds
      ) {
        state.hasDataGap = true;

        state.dataGapSeconds += Math.floor(
          packetGapSeconds
        );
      }
    }

    const currentLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const previousLocation =
      state.lastLocation;

    let calculatedSpeed = 0;

    if (
      previousLocation &&
      previousTime
    ) {
      calculatedSpeed =
        this.getCalculatedSpeedKmph(
          previousLocation,
          currentLocation,
          previousTime,
          currentTime
        );
    }

    const vehicleMaximumSpeed = Number(
      vehicleDoc?.performance?.maxSpeed || 0
    );

    if (
      vehicleMaximumSpeed > 0 &&
      calculatedSpeed >
        vehicleMaximumSpeed *
          config.detection.gpsJumpSpeedMultiplier
    ) {
      state.lastMovementReason = "GPS_JUMP";

      await state.save();

      return;
    }

    const reportedSpeed = Number(
      location.speed || 0
    );

    const isLowSpeed =
      reportedSpeed <=
      config.detection.stationarySpeedThreshold;

    if (
      state.movementState === "UNKNOWN" ||
      state.movementState === "MOVING"
    ) {
      if (isLowSpeed) {
        state.movementState = "POSSIBLE_STOP";

        state.anchorLocation = currentLocation;

        state.candidateStartedAt = currentTime;

        state.stationaryPacketCount = 1;
        state.movementPacketCount = 0;

        state.gpsPacketCount = 1;

        state.minimumSpeed = reportedSpeed;
        state.maximumSpeed = reportedSpeed;

        state.ignitionAtStart =
          location.ignition;

        state.lastMovementReason =
          "LOW_SPEED_CANDIDATE";
      } else {
        state.movementState = "MOVING";

        state.lastMovementReason =
          "SPEED_CONFIRMED";
      }
    } else if (
      state.movementState === "POSSIBLE_STOP"
    ) {
      const distanceFromAnchor =
        state.anchorLocation
          ? this.getDistanceMeters(
              state.anchorLocation,
              currentLocation
            )
          : 0;

      const isWithinStationaryRadius =
        distanceFromAnchor <=
        config.detection.stationaryRadiusMeters;

      if (
        isLowSpeed &&
        isWithinStationaryRadius
      ) {
        state.stationaryPacketCount += 1;

        state.gpsPacketCount += 1;

        state.minimumSpeed = Math.min(
          state.minimumSpeed ?? reportedSpeed,
          reportedSpeed
        );

        state.maximumSpeed = Math.max(
          state.maximumSpeed ?? reportedSpeed,
          reportedSpeed
        );

        if (
          state.stationaryPacketCount >=
          config.detection
            .stationaryConfirmationPackets
        ) {
          state.movementState = "STATIONARY";

          state.stopStartedAt =
            state.candidateStartedAt;

          state.stationaryConfirmedAt =
            currentTime;

          state.lastMovementReason =
            "STATIONARY_CONFIRMED";
        }
      } else {
        await this.resetState(
          state,
          location,
          "MOVING",
          "STOP_CANDIDATE_REJECTED"
        );

        return;
      }
    } else if (
      state.movementState === "STATIONARY" ||
      state.movementState ===
        "POSSIBLE_MOVEMENT"
    ) {
      const distanceFromAnchor =
        state.anchorLocation
          ? this.getDistanceMeters(
              state.anchorLocation,
              currentLocation
            )
          : 0;

      const hasDisplacement =
        distanceFromAnchor >
        config.detection.stationaryRadiusMeters;

      const movementEvidence =
        hasDisplacement ||
        reportedSpeed >
          config.detection.stationarySpeedThreshold;

      state.gpsPacketCount += 1;

      state.minimumSpeed = Math.min(
        state.minimumSpeed ?? reportedSpeed,
        reportedSpeed
      );

      state.maximumSpeed = Math.max(
        state.maximumSpeed ?? reportedSpeed,
        reportedSpeed
      );

      if (movementEvidence) {
        state.movementState =
          "POSSIBLE_MOVEMENT";

        state.movementPacketCount += 1;

        state.lastMovementReason =
          hasDisplacement
            ? "GPS_DISPLACEMENT"
            : "SPEED_MOVEMENT";
      } else {
        state.movementState = "STATIONARY";

        state.movementPacketCount = 0;

        state.lastMovementReason =
          "STATIONARY_CONTINUES";
      }

      if (
        state.movementPacketCount >=
        config.detection
          .movementConfirmationPackets
      ) {
        await this.closeStop(
          state,
          location,
          config,
          "MOVEMENT_CONFIRMED",
          actor
        );

        await this.resetState(
          state,
          location,
          "MOVING",
          "MOVEMENT_CONFIRMED"
        );

        return;
      }
    }

    state.lastLocation = currentLocation;

    state.lastPacketTime = currentTime;

    state.lastIgnition = location.ignition;

    await state.save();
  }
}

export const haltDetectionService =
  new HaltDetectionService();