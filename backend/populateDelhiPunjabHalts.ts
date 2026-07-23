import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";

import { VehicleLocationHistory } from "./src/models/VehicleLocationCoordinateHistory";
import { Vehicle } from "./src/models/Vehicle";
import { VehicleStopState } from "./src/models/VehicleStopState";
import { VehicleStopHistory } from "./src/models/VehicleStopHistory";
import { VehicleHaltConfig } from "./src/models/VehicleHaltConfig";
import { Geofence } from "./src/models/Geofence";
import { haltDetectionService } from "./src/services/haltDetection.service";

dotenv.config();

const MONGO_URI: string =
  process.env.MONGODB_URI || "";

if (!MONGO_URI) {
  throw new Error(
    "MONGODB_URI is missing in .env"
  );
}

const VEHICLE_ID = new Types.ObjectId(
  "6a327fc6b9738d01111f66e0"
);

const DEVICE_ID = "86373807243657";

const SIMULATION_DAYS = 3;

const BATCH_SIZE = 1000;

type Coordinate = [number, number];

const DELHI: Coordinate = [
  28.6139,
  77.209,
];

const DAY_HALT_LOCATION: Coordinate = [
  29.3909,
  76.9635,
];

const NIGHT_HALT_LOCATION: Coordinate = [
  30.3398,
  76.3869,
];

const PUNJAB: Coordinate = [
  30.901,
  75.8573,
];

const PHASES = {

  DELHI_TO_DAY_HALT: 3000,

  DAY_HALT: 5000,

  DAY_TO_NIGHT_HALT: 3000,

  NIGHT_HALT: 6000,

  NIGHT_TO_PUNJAB: 3000,

};

function interpolate(
  start: number,
  end: number,
  factor: number
): number {
  return start + (end - start) * factor;
}


function getMovingCoordinate(
  start: Coordinate,
  end: Coordinate,
  index: number,
  total: number
) {
  const factor =
    index / Math.max(total - 1, 1);

  let latitude = interpolate(
    start[0],
    end[0],
    factor
  );

  let longitude = interpolate(
    start[1],
    end[1],
    factor
  );

  latitude +=
    (Math.random() - 0.5) * 0.00002;

  longitude +=
    (Math.random() - 0.5) * 0.00002;

  return {
    latitude: Number(
      latitude.toFixed(7)
    ),

    longitude: Number(
      longitude.toFixed(7)
    ),
  };
}

function getHaltCoordinate(
  center: Coordinate
) {
  const latitude =
    center[0] +
    (Math.random() - 0.5) * 0.00005;

  const longitude =
    center[1] +
    (Math.random() - 0.5) * 0.00005;

  return {
    latitude: Number(
      latitude.toFixed(7)
    ),

    longitude: Number(
      longitude.toFixed(7)
    ),
  };
}

async function populateData() {
  try {
   await mongoose.connect(MONGO_URI, {
  dbName: "vehicle_monitoring_system",
});

    console.log(
      "======================================"
    );

    console.log("MongoDB Connected");

    console.log(
      "======================================"
    );

    console.log(
  "DB NAME:",
  mongoose.connection.db?.databaseName
);

console.log(
  "VEHICLE ID SEARCHING:",
  VEHICLE_ID.toString()
);

const totalVehicles =
  await Vehicle.countDocuments();

console.log(
  "TOTAL VEHICLES:",
  totalVehicles
);

const sampleVehicles =
  await Vehicle.find({})
    .select(
      "_id vehicleNumber deviceId vehicle_tag_name"
    )
    .limit(10)
    .lean();

console.log(
  "AVAILABLE VEHICLES:",
  sampleVehicles
);

    const vehicleDoc =
      await Vehicle.findById(
        VEHICLE_ID
      ).lean();

    if (!vehicleDoc) {
      throw new Error(
        "Vehicle not found"
      );
    }

    console.log(
      "Vehicle Found:",
      vehicleDoc.vehicleNumber
    );

    console.log(
      "Vehicle ID:",
      VEHICLE_ID.toString()
    );

    console.log(
      "Device ID:",
      DEVICE_ID
    );

    const haltConfig =
      await VehicleHaltConfig.findOne({
        vehicleId: VEHICLE_ID,
      }).lean();

    if (!haltConfig) {
      throw new Error(
        "Vehicle halt configuration not found"
      );
    }

    console.log(
      "Halt Config Found"
    );

    console.log(
      "Day Halt:",
      haltConfig.dayHalt
    );

    console.log(
      "Night Halt:",
      haltConfig.nightHalt
    );

    console.log(
      "Detection Config:",
      haltConfig.detection
    );

    const assignedGeofence =
      await Geofence.findOne({
        baseId: vehicleDoc.baseId,
      }).lean();

    if (!assignedGeofence) {
      throw new Error(
        "Assigned geofence not found"
      );
    }

    console.log(
      "Assigned Geofence:",
      assignedGeofence.name
    );

    console.log(
      "Geofence Center:",
      assignedGeofence.center
    );

    console.log(
      "Geofence Radius:",
      assignedGeofence.radius
    );

    console.log(
      "======================================"
    );

    console.log(
      "CLEARING OLD TEST DATA"
    );

    await VehicleStopState.deleteOne({
      vehicleId: VEHICLE_ID,
    });

    await VehicleStopHistory.deleteMany({
      vehicleId: VEHICLE_ID,
    });

    await VehicleLocationHistory.deleteMany({
      vehicleId: VEHICLE_ID,
      source: "simulation",
    });

    console.log(
      "Old VehicleStopState cleared"
    );

    console.log(
      "Old VehicleStopHistory cleared"
    );

    console.log(
      "Old simulation history cleared"
    );

    console.log(
      "======================================"
    );

    /*
      08 JULY 2026

      UTC:
      03:00 AM

      INDIA:
      08:30 AM IST

      Day Halt should happen during
      configured day halt window.

      Night Halt should happen later.
    */

   const startDate = new Date(
  "2026-07-08T00:30:00.000Z"
);
    /*
      IMPORTANT

      10 seconds between packets.

      10,000 points
      =
      100,000 seconds
      =
      around 27.7 hours.

      This allows Day + Night halt
      windows to occur.
    */

    const PACKET_INTERVAL_SECONDS = 10;

    console.log(
      "Simulation Start UTC:",
      startDate.toISOString()
    );

    console.log(
      "Packet Interval:",
      PACKET_INTERVAL_SECONDS,
      "seconds"
    );

  

    console.log(
      "======================================"
    );

    let docs: any[] = [];

    let globalIndex = 0;

    async function flushBatch() {
      if (!docs.length) {
        return;
      }

      const batchToProcess = docs;

      docs = [];

      const insertedDocs =
        await VehicleLocationHistory.insertMany(
          batchToProcess,
          {
            ordered: false,
          }
        );

      for (
        const location of insertedDocs
      ) {
        await haltDetectionService.process(
          location as any,
          vehicleDoc,
          "SYSTEM"
        );
      }

      console.log(
       `Inserted & Processed ${globalIndex}`
      );
    }

    async function addMovingPhase(
      name: string,
      start: Coordinate,
      end: Coordinate,
      totalPoints: number
    ) {
      console.log("");

      console.log(
        `START ${name}`
      );

      console.log(
        "Start Index:",
        globalIndex
      );

      for (
        let i = 0;
        i < totalPoints;
        i += 1
      ) {
        const coordinate =
          getMovingCoordinate(
            start,
            end,
            i,
            totalPoints
          );

        const currentTime = new Date(
          startDate.getTime() +
            globalIndex *
              PACKET_INTERVAL_SECONDS *
              1000
        );

        docs.push({
          vehicleId: VEHICLE_ID,

          deviceId: DEVICE_ID,

          time: currentTime,

          latitude:
            coordinate.latitude,

          longitude:
            coordinate.longitude,

          elevation: Math.floor(
            100 +
              Math.random() * 300
          ),

          speed: Math.floor(
            35 +
              Math.random() * 45
          ),

          angle: Math.floor(
            Math.random() * 360
          ),

          ignition: true,

          source: "simulation",

          createdBy: "SYSTEM",

          createdLocalDateTime:
            currentTime,

          createdOffset: "+05:30",

          createdTimezone:
            "Asia/Kolkata",

          createdUtcDateTime:
            currentTime,

          createdAt: currentTime,

          updatedAt: currentTime,
        });

        globalIndex += 1;

        if (
          docs.length >= BATCH_SIZE
        ) {
          await flushBatch();
        }
      }

      console.log(
        `END ${name}`
      );

      console.log(
        "End Index:",
        globalIndex
      );
    }

    async function addHaltPhase(
      name: string,
      center: Coordinate,
      totalPoints: number,
      ignition: boolean
    ) {
      console.log("");

      console.log(
        `START ${name}`
      );

      console.log(
        "Start Index:",
        globalIndex
      );

      const haltStartTime =
        new Date(
          startDate.getTime() +
            globalIndex *
              PACKET_INTERVAL_SECONDS *
              1000
        );

      console.log(
        "Halt Start UTC:",
        haltStartTime.toISOString()
      );

      console.log(
        "Halt Start India:",
        haltStartTime.toLocaleString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
          }
        )
      );

      for (
        let i = 0;
        i < totalPoints;
        i += 1
      ) {
        const coordinate =
          getHaltCoordinate(
            center
          );

        const currentTime = new Date(
          startDate.getTime() +
            globalIndex *
              PACKET_INTERVAL_SECONDS *
              1000
        );

        docs.push({
          vehicleId: VEHICLE_ID,

          deviceId: DEVICE_ID,

          time: currentTime,

          latitude:
            coordinate.latitude,

          longitude:
            coordinate.longitude,

          elevation: Math.floor(
            100 +
              Math.random() * 50
          ),

          speed:
            Math.random() > 0.98
              ? 0.5
              : 0,

          angle: Math.floor(
            Math.random() * 360
          ),

          ignition,

          source: "simulation",

          createdBy: "SYSTEM",

          createdLocalDateTime:
            currentTime,

          createdOffset: "+05:30",

          createdTimezone:
            "Asia/Kolkata",

          createdUtcDateTime:
            currentTime,

          createdAt: currentTime,

          updatedAt: currentTime,
        });

        globalIndex += 1;

        if (
          docs.length >= BATCH_SIZE
        ) {
          await flushBatch();
        }
      }

      const haltEndTime =
        new Date(
          startDate.getTime() +
            (globalIndex - 1) *
              PACKET_INTERVAL_SECONDS *
              1000
        );

      console.log(
        "Halt End UTC:",
        haltEndTime.toISOString()
      );

      console.log(
        "Halt End India:",
        haltEndTime.toLocaleString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
          }
        )
      );

      console.log(
        `END ${name}`
      );

      console.log(
        "End Index:",
        globalIndex
      );
    }

   for (let day = 1; day <= SIMULATION_DAYS; day++) {

  console.log(
    `========== DAY ${day} ==========`
  );

  await addMovingPhase(
    `DAY ${day} : DELHI TO DAY HALT`,
    DELHI,
    DAY_HALT_LOCATION,
    PHASES.DELHI_TO_DAY_HALT
  );

  await addHaltPhase(
    `DAY ${day} : DAY HALT`,
    DAY_HALT_LOCATION,
    PHASES.DAY_HALT,
    true
  );

  await addMovingPhase(
    `DAY ${day} : DAY TO NIGHT`,
    DAY_HALT_LOCATION,
    NIGHT_HALT_LOCATION,
    PHASES.DAY_TO_NIGHT_HALT
  );

  await addHaltPhase(
    `DAY ${day} : NIGHT HALT`,
    NIGHT_HALT_LOCATION,
    PHASES.NIGHT_HALT,
    false
  );

  await addMovingPhase(
    `DAY ${day} : RETURN`,
    NIGHT_HALT_LOCATION,
    PUNJAB,
    PHASES.NIGHT_TO_PUNJAB
  );

}

    await flushBatch();

    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "SIMULATION COMPLETED"
    );

    console.log(
      "======================================"
    );

    console.log(
      "TOTAL INSERTED & PROCESSED:",
      globalIndex
    );

    console.log(
  "Simulation Days:",
  SIMULATION_DAYS
);

    const stopHistory =
      await VehicleStopHistory.find({
        vehicleId: VEHICLE_ID,
      })
        .sort({
          startedAt: 1,
        })
        .lean();

    console.log("");

    console.log(
      "TOTAL HALTS DETECTED:",
      stopHistory.length
    );

    console.log("");

    for (
      const stop of stopHistory
    ) {
      console.log(
        "--------------------------------------"
      );

      console.log(
        "Classification:",
        stop.classification
      );

      console.log(
        "Started At:",
        stop.startedAt
      );

      console.log(
        "Ended At:",
        stop.endedAt
      );

      console.log(
        "Duration Seconds:",
        stop.durationSeconds
      );

      console.log(
        "Day Duration:",
        stop.dayDurationSeconds
      );

      console.log(
        "Night Duration:",
        stop.nightDurationSeconds
      );

      console.log(
        "Day Qualified:",
        stop.dayHaltQualified
      );

      console.log(
        "Night Qualified:",
        stop.nightHaltQualified
      );

      console.log(
        "Completion Reason:",
        stop.completionReason
      );

      console.log(
        "GPS Packets:",
        stop.gpsPacketCount
      );

      console.log(
        "Anchor:",
        stop.anchorLocation
      );
    }

    console.log(
      "======================================"
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("");

    console.error(
      "SIMULATION ERROR:",
      error
    );

    if (
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.disconnect();
    }

    process.exit(1);
  }
}

populateData();