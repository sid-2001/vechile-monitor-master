import { IVehicleLocation, VehicleLocation } from "../models/VehicleLocation";
import { emitVehicleLocationUpdate, emitAllVehicleLocationUpdate } from "../socket/vehicle.socket";

export class VehicleLocationService {

  async create(payload: Partial<IVehicleLocation>, actor: string): Promise<any> {
    const doc = new VehicleLocation(payload);
    doc.$locals.currentUser = actor;

    const saved = await doc.save();

    // Get latest location of all vehicles
    const latestVehicles = await this.getLatestLocationsOfAllVehicles();

     console.log(" EMITTING BULK DATA:", latestVehicles); 

    // Emit ALL vehicles (bulk)
    emitAllVehicleLocationUpdate(latestVehicles);

    // Emit single vehicle (old logic safe)
    emitVehicleLocationUpdate({
      vehicleId: String(saved.vehicleId),
      latitude: saved.latitude,
      longitude: saved.longitude,
      speed: saved.speed,
      ignition: saved.ignition,
      time: saved.time
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

  // async getLatestLocationsOfAllVehicles() {
  //   return VehicleLocation.aggregate([
  //     { $sort: { vehicleId: 1, time: -1 } },
  //     {
  //       $group: {
  //         _id: "$vehicleId",
  //         vehicleId: { $first: "$vehicleId" },
  //         latitude: { $first: "$latitude" },
  //         longitude: { $first: "$longitude" },
  //         speed: { $first: "$speed" },
  //         ignition: { $first: "$ignition" },
  //         time: { $first: "$time" }
  //       }
  //     }
  //   ]);
  // }


//   async getLatestLocationsOfAllVehicles() {
//   return VehicleLocation.aggregate([
//     { $sort: { vehicleId: 1, time: -1 } }, // latest first
//     {
//       $group: {
//         _id: "$vehicleId",
//         vehicleId: { $first: "$vehicleId" },
//         latitude: { $first: "$latitude" },
//         longitude: { $first: "$longitude" },
//         vehicleNumber: { $first: "$vehicleNumber" },
//         speed: { $first: "$speed" },
//         ignition: { $first: "$ignition" },
//         time: { $first: "$time" },
//         angle: { $first: "$angle" }
//       }
//     }
//   ]);
// }



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
        angle: { $first: "$angle" }
      }
    },

    {
      $lookup: {
        from: "vehicles",   // 
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicleData"
      }
    },

    {
      $unwind: {
        path: "$vehicleData",
        preserveNullAndEmptyArrays: true
      }
    },

   
    {
      $addFields: {
        vehicleNumber: "$vehicleData.vehicleNumber"
      }
    }
  ]);
}
}

export const vehicleLocationService = new VehicleLocationService();