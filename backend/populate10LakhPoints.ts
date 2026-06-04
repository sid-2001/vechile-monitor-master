import mongoose, { Types } from "mongoose";
import { VehicleLocationHistory } from "./src/models/VehicleLocationCoordinateHistory";

const MONGO_URI =
  "mongodb://172.16.34.109:27017/vehicle_monitoring_system";

// SECOND VEHICLE ID
const VEHICLE_ID = new Types.ObjectId(
  "6a04662f3b17f9bdbdf4f510"
);

// 60 LAKH DATA
const TOTAL_POINTS = 6000000;

const BATCH_SIZE = 10000;

// Kashmir -> Kanyakumari Route
const ROUTE = [
  [34.0837, 74.7973], // Srinagar Kashmir
  [33.7782, 76.5762],
  [32.7266, 74.8570], // Jammu
  [30.7333, 76.7794], // Chandigarh
  [28.6139, 77.2090], // Delhi
  [26.9124, 75.7873], // Jaipur
  [23.0225, 72.5714], // Ahmedabad
  [19.0760, 72.8777], // Mumbai
  [15.2993, 74.1240], // Goa
  [12.9716, 77.5946], // Bangalore
  [10.8505, 76.2711], // Kerala
  [8.0883, 77.5385], // Kanyakumari
];

function interpolate(
  start: number,
  end: number,
  factor: number
) {
  return start + (end - start) * factor;
}

async function populateData() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB Connected");

    const endDate = new Date();

    // second wise history
    const startDate = new Date(
      endDate.getTime() -
        TOTAL_POINTS * 1000
    );

    let docs: any[] = [];

    // total route segments
    const totalSegments =
      ROUTE.length - 1;

    // equal points per segment
    const pointsPerSegment =
      Math.floor(
        TOTAL_POINTS / totalSegments
      );

    for (
      let i = 0;
      i < TOTAL_POINTS;
      i++
    ) {
      // current segment
      const routeIndex = Math.min(
        totalSegments - 1,
        Math.floor(
          i / pointsPerSegment
        )
      );

      const start =
        ROUTE[routeIndex];

      const end =
        ROUTE[routeIndex + 1];

      // local movement in segment
      const localIndex =
        i % pointsPerSegment;

      const factor =
        localIndex /
        pointsPerSegment;

      // interpolate location
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

      // realistic GPS drift
      latitude +=
        (Math.random() - 0.5) *
        0.0001;

      longitude +=
        (Math.random() - 0.5) *
        0.0001;

      const currentTime = new Date(
        startDate.getTime() +
          i * 1000
      );

      docs.push({
        vehicleId: VEHICLE_ID,

        deviceId: "863738072436505",

        time: currentTime,

        latitude: Number(
          latitude.toFixed(7)
        ),

        longitude: Number(
          longitude.toFixed(7)
        ),

        elevation: Math.floor(
          100 + Math.random() * 500
        ),

        speed: Math.floor(
          30 + Math.random() * 70
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

      // batch insert
      if (
        docs.length >= BATCH_SIZE
      ) {
        await VehicleLocationHistory.insertMany(
          docs,
          {
            ordered: false,
          }
        );

        console.log(
          `✅ Inserted ${
            i + 1
          } / ${TOTAL_POINTS}`
        );

        docs = [];
      }
    }

    // remaining docs
    if (docs.length > 0) {
      await VehicleLocationHistory.insertMany(
        docs,
        {
          ordered: false,
        }
      );
    }

    console.log(
      "🔥 60 LAKH CONNECTED INDIA ROUTE DATA INSERTED"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ ERROR:",
      error
    );

    process.exit(1);
  }
}

populateData();