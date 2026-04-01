import { getIo } from "./index";

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
