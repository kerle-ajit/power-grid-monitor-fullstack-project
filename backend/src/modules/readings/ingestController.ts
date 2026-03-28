import type { Request, Response } from "express";
import { createIngestService } from "./ingestService";

const service = createIngestService();

export function createIngestController() {
  return {
    ingest: async (req: Request, res: Response) => {
      const result = await service.ingest(req.body);
      res.json(result);
    }
  };
}

