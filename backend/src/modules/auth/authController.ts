import type { Request, Response } from "express";
import { createAuthService } from "./authService";

const service = createAuthService();

export function createAuthController() {
  return {
    login: async (req: Request, res: Response) => {
      const { username, password } = req.body ?? {};
      const result = await service.login({ username, password });
      res.json(result);
    },
    me: async (req: Request, res: Response) => {
      const user = req.user!;
      res.json({ id: user.id, role: user.role, zoneIds: user.zoneIds });
    }
  };
}

