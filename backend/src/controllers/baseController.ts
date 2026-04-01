import { createCrudController } from "./crudFactory";
import { Base } from "../models/Base";

export const baseController = createCrudController(Base, ["name", "code", "city", "state"]);
