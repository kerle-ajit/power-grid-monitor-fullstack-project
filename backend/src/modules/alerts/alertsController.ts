import type { Request, Response } from "express";
import { createAlertsService } from "./alertsService";

const service = createAlertsService();

export function createAlertsController() {
  return {
    listAlerts: async (req: Request, res: Response) => {
      const user = req.user!;
      const result = await service.listAlerts(user, req.query);
      res.json(result);
    },
    ackAlert: async (req: Request, res: Response) => {
      const user = req.user!;
      const alertId = req.params.alertId;
      const result = await service.ackAlert(user, alertId);
      res.json(result);
    },
    resolveAlert: async (req: Request, res: Response) => {
      const user = req.user!;
      const alertId = req.params.alertId;
      const result = await service.resolveAlert(user, alertId);
      res.json(result);
    }
  };
}

