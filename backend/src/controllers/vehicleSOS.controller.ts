import { Request, Response } from "express";
import mongoose from "mongoose";
import VehicleSOS from "../models/VehicleSOS";
import {
  emitVehicleSOSCreated,
  emitVehicleSOSClosed,
} from "../socket/vehicle.socket";
import { Vehicle } from "../models/Vehicle";
// import { Vehicle } from "../models/Vehicle";
import { User } from "../models/User"; 

//create
export const createSOS = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { vehicleId } = req.body as { vehicleId: string };

    if (!vehicleId) {
      res.status(400).json({ message: "vehicleId is required" });
      return;
    }

    // check if already OPEN SOS exists
    const existingSOS = await VehicleSOS.findOne({
      vehicleId: new mongoose.Types.ObjectId(vehicleId),
      status: "OPEN",
    });

    if (existingSOS) {
      console.log("⚡ EXISTING SOS - EMITTING AGAIN");

      const vehicle = await Vehicle.findById(existingSOS.vehicleId).lean();

      emitVehicleSOSCreated({
        sosId: existingSOS._id.toString(),
        vehicleId: existingSOS.vehicleId.toString(),
        vehicleNumber: vehicle?.vehicleNumber || "Unknown",
        createdAt: existingSOS.createdAt,
      });
      await Vehicle.findByIdAndUpdate(existingSOS.vehicleId, {
  onSOS: true,
});

      res.status(200).json(existingSOS);
      return;
    }

    // create new SOS
    const sos = await VehicleSOS.create({
      vehicleId: new mongoose.Types.ObjectId(vehicleId),
    });
    //  UPDATE VEHICLE onSOS = true
await Vehicle.findByIdAndUpdate(vehicleId, {
  onSOS: true,
});

    console.log("🚨 EMITTING SOS CREATED");

    const vehicle = await Vehicle.findById(sos.vehicleId).lean();

    emitVehicleSOSCreated({
      sosId: sos._id.toString(),
      vehicleId: sos.vehicleId.toString(),
      vehicleNumber: vehicle?.vehicleNumber || "Unknown",
      createdAt: sos.createdAt,
    });

    res.status(201).json(sos);
  } catch (error: unknown) {
    console.error("CREATE SOS ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//close
export const closeSOS = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id as string;

    if (!id) {
      res.status(400).json({ message: "SOS id is required" });
      return;
    }

    const sos = await VehicleSOS.findByIdAndUpdate(
      id,
      {
        status: "CLOSED",
        closedAt: new Date(),
        closedBy: userId
          ? new mongoose.Types.ObjectId(userId)
          : null,
      },
      { new: true }
    );

    if (!sos) {
      res.status(404).json({ message: "SOS not found" });
      return;
    }
    await Vehicle.findByIdAndUpdate(sos.vehicleId, {
  onSOS: false,
});

   const vehicle = await Vehicle.findById(sos.vehicleId).lean();
const user = userId ? await User.findById(userId).lean() : null;

emitVehicleSOSClosed({
  sosId: sos._id.toString(),
  vehicleId: sos.vehicleId.toString(),
  vehicleNumber: vehicle?.vehicleNumber || "Unknown",
  closedAt: sos.closedAt as Date,
  closedBy: user?.username || "Unknown", // ✅ username
});

    res.status(200).json(sos);
  } catch (error: unknown) {
    console.error("CLOSE SOS ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};