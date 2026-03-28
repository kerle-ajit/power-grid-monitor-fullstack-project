import type { Request, Response, NextFunction } from "express";
import { httpError } from "./errors";
import { verifyAccessToken } from "./jwt";
import { prisma } from "../database/prismaClient";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw httpError(401, "Missing Authorization token", "AUTH_MISSING");

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true }
    });
    if (!user) throw httpError(401, "Invalid token user", "AUTH_INVALID");

    if (user.role !== payload.role) {
      throw httpError(401, "Invalid token role", "AUTH_ROLE_MISMATCH");
    }

    let zoneIds: string[] = [];
    if (user.role === "OPERATOR") {
      const assignments = await prisma.userZone.findMany({
        where: { userId: user.id },
        select: { zoneId: true }
      });
      zoneIds = assignments.map((a) => a.zoneId);
      if (zoneIds.length === 0) throw httpError(403, "Operator has no zone assignments", "NO_ZONES");
    }

    req.user = { id: user.id, role: user.role, zoneIds };
    next();
  } catch (e) {
    next(e);
  }
}

