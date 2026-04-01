import { Request } from "express";
import { Vehicle } from "../models/Vehicle";
import { createCrudController } from "./crudFactory";

const extraFilter = (req: Request): Record<string, unknown> => ({
  ...(req.query.baseId ? { baseId: req.query.baseId } : {}),
  ...(req.query.status ? { status: req.query.status } : {})
});

export const vehicleController = createCrudController(Vehicle, ["vehicleNumber", "type", "model"], extraFilter);
