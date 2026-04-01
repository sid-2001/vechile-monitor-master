import { Base } from "../models/Base";
import { userService } from "../services/user.service";
import { Vehicle } from "../models/Vehicle";
import { VehicleLocation } from "../models/VehicleLocation";

export const runDefaultSeed = async (): Promise<void> => {
  if (await Base.countDocuments()) return;
  const base = await new Base({ name: "Jalandhar Base", location: { latitude: 31.326, longitude: 75.576 }, address: { state: "Punjab", city: "Jalandhar", pincode: "144001", country: "India" } }).save();
  const admin = await userService.create({ username: "admin", password: "Admin@123", role: "ADMIN", baseId: base._id as any, name: { first: "System", last: "Admin" }, contact: { mobile: "9999999999", email: "admin@vehicle.local" } }, "SYSTEM");
  const driver = await userService.create({ username: "driver1", password: "Driver@123", role: "DRIVER", baseId: base._id as any, name: { first: "Sample", last: "Driver" }, contact: { mobile: "8888888888", email: "driver1@vehicle.local" } }, String(admin.username));
  await userService.create({ username: "operator1", password: "Operator@123", role: "OPERATOR", baseId: base._id as any, name: { first: "Sample", last: "Operator" }, contact: { mobile: "7777777777", email: "operator1@vehicle.local" } }, String(admin.username));
  const vehicle = await new Vehicle({ vehicleNumber: "PB10AA1001", licensePlate: "PB10AA1001", type: "TRUCK", subType: "HEAVY", manufacturer: { name: "Tata", model: "Signa", variant: "LPT" }, manufacturing: { year: 2022, fuelType: "Diesel", engineNumber: "ENG001", chassisNumber: "CHS001" }, physical: { color: "White", category: "Commercial", dimensions: { length: 10, width: 3, height: 4, unit: "m" }, loadCapacity: 8000, axles: 2 }, performance: { transmissionType: "Manual", fuelTankCapacity: 250, maxSpeed: 100, minSpeed: 0 }, deviceId: "DEV-1001", baseId: base._id as any, driverId: driver._id as any, onSOS: false, status: { isActive: true } }).save();
  await new VehicleLocation({ vehicleId: vehicle._id as any, deviceId: vehicle.deviceId, time: new Date(), latitude: 31.326, longitude: 75.576, speed: 55, ignition: true }).save();
};
