import { Request } from "express";
import { VehicleLocation } from "../models/VehicleLocation";
import { createCrudController } from "./crudFactory";

const extraFilter = (req: Request): Record<string, unknown> => ({
  ...(req.query.vehicleId ? { vehicleId: req.query.vehicleId } : {})
});

export const vehicleLocationController = createCrudController(VehicleLocation, ["vehicleId"], extraFilter);
