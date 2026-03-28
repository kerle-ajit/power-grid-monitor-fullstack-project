import type { Request, Response } from "express";
import { createRulesService } from "./rulesService";

const service = createRulesService();

export function createRulesController() {
  return {
    getRuleConfig: async (req: Request, res: Response) => {
      const user = req.user!;
      const sensorId = req.params.sensorId;
      const config = await service.getConfig(user, sensorId);
      res.json(config);
    },
    upsertRuleConfig: async (req: Request, res: Response) => {
      const user = req.user!;
      const sensorId = req.params.sensorId;
      const config = await service.upsertConfig(user, sensorId, req.body);
      res.json(config);
    }
  };
}

