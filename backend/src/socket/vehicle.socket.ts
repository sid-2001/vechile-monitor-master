import { getIo } from "./index";

// SINGLE VEHICLE UPDATE 
export const emitVehicleLocationUpdate = (payload: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  time: Date;
  source?: "live" | "simulation";
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
  source?: "live" | "simulation";
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

export const emitGeofenceAlert = (payload: {
  vehicleId: string;
  vehicleNumber: string;
  geofenceName: string;
  eventType: "enter" | "exit";
  time: Date;
  source?: "live" | "simulation";
}): void => {
  const io = getIo();
  io.emit("vehicle:geofence:alert", payload);
};

export const emitVehicleSpeedAlert = (payload: {
  vehicleId: string;
  vehicleNumber: string;
  speed: number;
  maxSpeed: number;
  latitude: number;
  longitude: number;
  time: Date;
  source?: "live" | "simulation";
}): void => {
  const io = getIo();
  io.emit("vehicle:speed:alert", payload);
};

export const emitVehicleHarshBrakingAlert = (payload: {
  vehicleId: string;
  vehicleNumber: string;
  previousSpeed: number;
  speed: number;
  latitude: number;
  longitude: number;
  time: Date;
  source?: "live" | "simulation";
}): void => {
  const io = getIo();
  io.emit("vehicle:braking:alert", payload);
};
