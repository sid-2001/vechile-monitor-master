// import mongoose, { Types } from "mongoose";
// import { VehicleLocationHistory } from "./src/models/VehicleLocationCoordinateHistory";

// const MONGO_URI =
//   "mongodb://172.16.34.109:27017/vehicle_monitoring_system";

// // SECOND VEHICLE ID
// const VEHICLE_ID = new Types.ObjectId(
//   "6a04662f3b17f9bdbdf4f510"
// );

// // 60 LAKH DATA
// const TOTAL_POINTS = 6000000;

// const BATCH_SIZE = 10000;

// // Kashmir -> Kanyakumari Route
// const ROUTE = [
//   [34.0837, 74.7973], // Srinagar Kashmir
//   [33.7782, 76.5762],
//   [32.7266, 74.8570], // Jammu
//   [30.7333, 76.7794], // Chandigarh
//   [28.6139, 77.2090], // Delhi
//   [26.9124, 75.7873], // Jaipur
//   [23.0225, 72.5714], // Ahmedabad
//   [19.0760, 72.8777], // Mumbai
//   [15.2993, 74.1240], // Goa
//   [12.9716, 77.5946], // Bangalore
//   [10.8505, 76.2711], // Kerala
//   [8.0883, 77.5385], // Kanyakumari
// ];

// function interpolate(
//   start: number,
//   end: number,
//   factor: number
// ) {
//   return start + (end - start) * factor;
// }

// async function populateData() {
//   try {
//     await mongoose.connect(MONGO_URI);

//     console.log("✅ MongoDB Connected");

//     const endDate = new Date();

//     // second wise history
//     const startDate = new Date(
//       endDate.getTime() -
//         TOTAL_POINTS * 1000
//     );

//     let docs: any[] = [];

//     // total route segments
//     const totalSegments =
//       ROUTE.length - 1;

//     // equal points per segment
//     const pointsPerSegment =
//       Math.floor(
//         TOTAL_POINTS / totalSegments
//       );

//     for (
//       let i = 0;
//       i < TOTAL_POINTS;
//       i++
//     ) {
//       // current segment
//       const routeIndex = Math.min(
//         totalSegments - 1,
//         Math.floor(
//           i / pointsPerSegment
//         )
//       );

//       const start =
//         ROUTE[routeIndex];

//       const end =
//         ROUTE[routeIndex + 1];

//       // local movement in segment
//       const localIndex =
//         i % pointsPerSegment;

//       const factor =
//         localIndex /
//         pointsPerSegment;

//       // interpolate location
//       let latitude = interpolate(
//         start[0],
//         end[0],
//         factor
//       );

//       let longitude = interpolate(
//         start[1],
//         end[1],
//         factor
//       );

//       // realistic GPS drift
//       latitude +=
//         (Math.random() - 0.5) *
//         0.0001;

//       longitude +=
//         (Math.random() - 0.5) *
//         0.0001;

//       const currentTime = new Date(
//         startDate.getTime() +
//           i * 1000
//       );

//       docs.push({
//         vehicleId: VEHICLE_ID,

//         deviceId: "863738072436505",

//         time: currentTime,

//         latitude: Number(
//           latitude.toFixed(7)
//         ),

//         longitude: Number(
//           longitude.toFixed(7)
//         ),

//         elevation: Math.floor(
//           100 + Math.random() * 500
//         ),

//         speed: Math.floor(
//           30 + Math.random() * 70
//         ),

//         angle: Math.floor(
//           Math.random() * 360
//         ),

//         ignition: true,

//         source: "simulation",

//         createdBy: "SYSTEM",

//         createdLocalDateTime:
//           currentTime,

//         createdOffset: "+05:30",

//         createdTimezone:
//           "Asia/Kolkata",

//         createdUtcDateTime:
//           currentTime,

//         createdAt: currentTime,

//         updatedAt: currentTime,
//       });

//       // batch insert
//       if (
//         docs.length >= BATCH_SIZE
//       ) {
//         await VehicleLocationHistory.insertMany(
//           docs,
//           {
//             ordered: false,
//           }
//         );

//         console.log(
//           `✅ Inserted ${
//             i + 1
//           } / ${TOTAL_POINTS}`
//         );

//         docs = [];
//       }
//     }

//     // remaining docs
//     if (docs.length > 0) {
//       await VehicleLocationHistory.insertMany(
//         docs,
//         {
//           ordered: false,
//         }
//       );
//     }

//     console.log(
//       "🔥 60 LAKH CONNECTED INDIA ROUTE DATA INSERTED"
//     );

//     process.exit(0);
//   } catch (error) {
//     console.error(
//       "❌ ERROR:",
//       error
//     );

//     process.exit(1);
//   }
// }

// populateData();


import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import { VehicleLocation } from "./src/models/VehicleLocation";
import { VehicleLocationHistory } from "./src/models/VehicleLocationCoordinateHistory";
import { Vehicle } from "./src/models/Vehicle";
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
  "69d8dcdca400566e5e9f1ed4"
);

const DEVICE_ID = "863738072436505";
const TOTAL_POINTS = 10000;
const BATCH_SIZE = 1000;

type Coordinate = [number, number];

const DELHI: Coordinate = [
  28.6139,
  77.2090,
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
  30.9010,
  75.8573,
];

const PHASES = {
  DELHI_TO_DAY_HALT: 2500,
  DAY_HALT: 1500,
  DAY_TO_NIGHT_HALT: 2500,
  NIGHT_HALT: 2000,
  NIGHT_TO_PUNJAB: 1500,
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
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  };
}

function getHaltCoordinate(
  center: Coordinate
) {
  const latitude =
    center[0] +
    (Math.random() - 0.5) * 0.00008;

  const longitude =
    center[1] +
    (Math.random() - 0.5) * 0.00008;

  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  };
}

async function populateData() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB Connected");

    const startDate = new Date(
      "2026-07-08T00:30:00.000Z"
    );

    let docs: any[] = [];
    let globalIndex = 0;

 async function flushBatch() {
  if (!docs.length) {
    return;
  }

  for (const payload of docs) {
    const saved = await VehicleLocation.create(payload);

    await VehicleLocationHistory.create({
      ...saved.toObject(),
      source: saved.source || "live",
    });

    const vehicleDoc = await Vehicle.findById(
      saved.vehicleId
    ).lean();

    if (vehicleDoc) {
      await haltDetectionService.process(
        saved,
        vehicleDoc,
        "SYSTEM"
      );
    }
  }

  console.log(
    `Processed ${globalIndex} / ${TOTAL_POINTS}`
  );

  docs = [];
}

    async function addMovingPhase(
      name: string,
      start: Coordinate,
      end: Coordinate,
      totalPoints: number
    ) {
      console.log(`START ${name}`);

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
            globalIndex * 1000
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
            100 + Math.random() * 300
          ),

          speed: Math.floor(
            35 + Math.random() * 45
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

      console.log(`END ${name}`);
    }

    async function addHaltPhase(
      name: string,
      center: Coordinate,
      totalPoints: number,
      ignition: boolean
    ) {
      console.log(`START ${name}`);

      for (
        let i = 0;
        i < totalPoints;
        i += 1
      ) {
        const coordinate =
          getHaltCoordinate(center);

        const currentTime = new Date(
          startDate.getTime() +
            globalIndex * 1000
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
            100 + Math.random() * 50
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

      console.log(`END ${name}`);
    }

    await addMovingPhase(
      "DELHI TO DAY HALT",
      DELHI,
      DAY_HALT_LOCATION,
      PHASES.DELHI_TO_DAY_HALT
    );

    await addHaltPhase(
      "DAY HALT",
      DAY_HALT_LOCATION,
      PHASES.DAY_HALT,
      true
    );

    await addMovingPhase(
      "DAY HALT TO NIGHT HALT",
      DAY_HALT_LOCATION,
      NIGHT_HALT_LOCATION,
      PHASES.DAY_TO_NIGHT_HALT
    );

    await addHaltPhase(
      "NIGHT HALT",
      NIGHT_HALT_LOCATION,
      PHASES.NIGHT_HALT,
      false
    );

    await addMovingPhase(
      "NIGHT HALT TO PUNJAB",
      NIGHT_HALT_LOCATION,
      PUNJAB,
      PHASES.NIGHT_TO_PUNJAB
    );

    await flushBatch();

    console.log(
      `TOTAL INSERTED: ${globalIndex}`
    );

    console.log(
      "DELHI TO PUNJAB TEST DATA INSERTED"
    );

    console.log(
      "DAY HALT POINTS:",
      PHASES.DAY_HALT
    );

    console.log(
      "NIGHT HALT POINTS:",
      PHASES.NIGHT_HALT
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "ERROR:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
}

populateData();