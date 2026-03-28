import type { Request, Response } from "express";
import { prisma } from "../../database/prismaClient";

export function createEscalationsController() {
  return {
    list: async (_req: Request, res: Response) => {
      const rows = await prisma.escalationLog.findMany({
        take: 100,
        orderBy: { escalatedAt: "desc" },
        include: {
          alert: {
            select: {
              id: true,
              sensorId: true,
              zoneId: true,
              status: true,
              severity: true,
              suppressed: true
            }
          }
        }
      });
      res.json({
        escalations: rows.map((r) => ({
          id: r.id,
          alertId: r.alertId,
          escalatedAt: r.escalatedAt,
          fromUserId: r.fromUserId,
          toUserId: r.toUserId,
          alert: r.alert
        }))
      });
    }
  };
}
