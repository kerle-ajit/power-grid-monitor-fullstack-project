import type { Request, Response } from "express";
import { createSuppressionsService } from "./suppressionsService";

const service = createSuppressionsService();

export function createSuppressionsController() {
  return {
    listSuppressions: async (req: Request, res: Response) => {
      const user = req.user!;
      const result = await service.listSuppressions(user);
      res.json(result);
    },
    createSuppression: async (req: Request, res: Response) => {
      const user = req.user!;
      const result = await service.createSuppression(user, req.body);
      res.json(result);
    }
  };
}

