import type { Request, Response } from "express";
import { createSensorsService } from "./sensorsService";

const service = createSensorsService();

export function createSensorsController() {
  return {
    listSensors: async (req: Request, res: Response) => {
      const user = req.user!;
      const result = await service.listSensorsForUser(user);
      res.json(result);
    },
    history: async (req: Request, res: Response) => {
      const user = req.user!;
      const sensorId = req.params.id;
      const result = await service.getSensorHistory(user, sensorId, req.query);
      res.json(result);
    }
  };
}

