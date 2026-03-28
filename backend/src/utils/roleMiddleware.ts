import type { Request, Response, NextFunction } from "express";
import { httpError } from "./errors";

export function requireSupervisor(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "SUPERVISOR") {
    next(httpError(403, "Supervisor access required", "SUPERVISOR_ONLY"));
    return;
  }
  next();
}
