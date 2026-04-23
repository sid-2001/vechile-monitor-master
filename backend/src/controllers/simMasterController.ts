import { Request, Response } from "express";
import SimMaster, { ISimMaster } from "../models/SimMaster";

export const simMasterController = {
  
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body.simnumber) {
      res.status(400).json({ message: "simnumber is required" });
      return;
    }

    if (req.body.phonenumber && !/^\d{10}$/.test(req.body.phonenumber)) {
      res.status(400).json({ message: "Phone number must be 10 digits" });
      return;
    }
      const sim: ISimMaster = new SimMaster(req.body);
      
      
      const savedSim = await sim.save();
      res.status(201).json(savedSim);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  
  list: async (req: Request, res: Response): Promise<void> => {
    try {
      const sims = await SimMaster.find();
      res.status(200).json(sims);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

 
  byId: async (req: Request, res: Response): Promise<void> => {
    try {
      const sim = await SimMaster.findById(req.params.id);

      if (!sim) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      res.status(200).json(sim);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

 
  update: async (req: Request, res: Response): Promise<void> => {
    try {
      
      const updated = await SimMaster.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  
  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await SimMaster.findByIdAndDelete(req.params.id);

      if (!deleted) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      res.status(200).json({ message: "Deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};