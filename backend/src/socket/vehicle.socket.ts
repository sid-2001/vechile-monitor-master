import { getIo } from "./index";

// SINGLE VEHICLE UPDATE 
export const emitVehicleLocationUpdate = (payload: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  time: Date;
}): void => {
  const io = getIo();
  io.emit("vehicleLocationUpdate", payload);
};

// BULK VEHICLE UPDATE 
export const emitAllVehicleLocationUpdate = (payload: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  time: Date;
}[]): void => {
  const io = getIo();
  io.emit("vehicleLocationBulkUpdate", payload);
};

// 🔥 SOS CREATED (OLD - UNCHANGED)
export const emitVehicleSOSCreated = (payload: {
  sosId: string;
  vehicleId: string;
  createdAt: Date;
   vehicleNumber: string;
}): void => {
  const io = getIo();
  console.log("🔥 EMIT SOS:", payload);
  console.log("🔥 EMIT vehicle:sos:created", payload);
  io.emit("vehicle:sos:created", payload);
};

// 🔥 SOS CLOSED (OLD - UNCHANGED)
export const emitVehicleSOSClosed = (payload: {
  sosId: string;
  vehicleId: string;
  closedAt: Date;
  closedBy: string;
   vehicleNumber: string;
}): void => {
  const io = getIo();
  io.emit("vehicle:sos:closed", payload);
};