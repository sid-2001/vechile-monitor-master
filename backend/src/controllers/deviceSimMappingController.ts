import { Request, Response } from "express";
import { deviceSimMappingService } from "../services/deviceSimMapping.service";

export const deviceSimMappingController = {

  create: async (req: Request, res: Response) => {
    try {
      const actor = "admin";

      const data = await deviceSimMappingService.create(req.body, actor);
      res.status(201).json(data);

    } catch (error: any) {
       console.error("Mapping error:", error.message);
    res.status(400).json({ message: error.message }); 
    }
  },

  list: async (_req: Request, res: Response) => {
    try {
      const data = await deviceSimMappingService.list();
      res.status(200).json(data);

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const actor = "admin";

      const data = await deviceSimMappingService.update(
        req.params.id,
        req.body,
        actor
      );

      res.status(200).json(data);

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await deviceSimMappingService.remove(req.params.id);
      res.status(200).json({ message: "Deleted" });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
};