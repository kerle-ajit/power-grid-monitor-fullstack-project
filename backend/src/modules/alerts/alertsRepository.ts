import { prisma } from "../../database/prismaClient";
import type { AlertStatus } from "@prisma/client";

export function createAlertsRepository() {
  return {
    async listAlertsForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      query: { status?: string; page: number; pageSize: number; includeSuppressed: boolean }
    ) {
      const status = query.status ? (query.status as any) : undefined;
      const where: any = {
        ...(user.role === "SUPERVISOR" ? {} : { zoneId: { in: user.zoneIds } })
      };

      if (status) where.status = status;

      if (!query.includeSuppressed) {
        where.suppressed = false;
      }

      const [totalCount, rows] = await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: {
            id: true,
            status: true,
            severity: true,
            suppressed: true,
            createdAt: true,
            updatedAt: true,
            sensorId: true,
            zoneId: true,
            anomalyId: true,
            anomaly: {
              select: {
                type: true,
                metric: true,
                timestamp: true,
                readingId: true
              }
            }
          }
        })
      ]);

      return {
        page: query.page,
        pageSize: query.pageSize,
        totalCount,
        alerts: rows.map((a) => ({
          alertId: a.id,
          status: a.status,
          severity: a.severity,
          suppressed: a.suppressed,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          sensorId: a.sensorId,
          zoneId: a.zoneId,
          anomaly: a.anomaly
            ? {
                anomalyId: a.anomalyId,
                type: a.anomaly.type,
                metric: a.anomaly.metric,
                timestamp: a.anomaly.timestamp,
                readingId: a.anomaly.readingId
              }
            : null
        }))
      };
    },

    async getAlertForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      alertId: string
    ) {
      const alert = await prisma.alert.findFirst({
        where: {
          id: alertId,
          ...(user.role === "SUPERVISOR" ? {} : { zoneId: { in: user.zoneIds } })
        },
        select: {
          id: true,
          status: true,
          severity: true,
          suppressed: true,
          sensorId: true,
          zoneId: true,
          anomalyId: true,
          anomaly: {
            select: {
              id: true,
              type: true
            }
          }
        }
      });
      return alert;
    },

    async createAlertForAnomaly(params: {
      anomalyId: string;
      sensorId: string;
      zoneId: string;
      severity: "WARNING" | "CRITICAL";
      suppressed: boolean;
      assignedToUserId: string | null;
    }) {
      return prisma.alert.create({
        data: {
          anomalyId: params.anomalyId,
          sensorId: params.sensorId,
          zoneId: params.zoneId,
          status: "OPEN",
          severity: params.severity,
          suppressed: params.suppressed,
          assignedToUserId: params.assignedToUserId ?? undefined
        }
      });
    },

    async transitionAlertStatus(params: {
      alertId: string;
      fromStatus: AlertStatus;
      toStatus: AlertStatus;
      changedByUserId: string;
    }) {
      return prisma.$transaction(async (tx) => {
        // Guard the fromStatus to avoid race transitions.
        const updated = await tx.alert.updateMany({
          where: { id: params.alertId, status: params.fromStatus },
          data: { status: params.toStatus }
        });
        if (updated.count !== 1) {
          return null;
        }
        await tx.alertAuditLog.create({
          data: {
            alertId: params.alertId,
            fromStatus: (params.fromStatus as any) ?? null,
            toStatus: params.toStatus as any,
            changedByUserId: params.changedByUserId
          }
        });

        return tx.alert.findUnique({ where: { id: params.alertId } });
      });
    },

    async resolveAlertDirectly(params: {
      alertId: string;
      toStatus: "RESOLVED";
      changedByUserId: string;
      allowFrom: Array<"OPEN" | "ACKNOWLEDGED">;
    }) {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.alert.findUnique({
          where: { id: params.alertId },
          select: { id: true, status: true }
        });
        if (!existing) return null;
        if (!params.allowFrom.includes(existing.status as any)) return null;

        await tx.alert.update({
          where: { id: params.alertId },
          data: { status: params.toStatus }
        });
        await tx.alertAuditLog.create({
          data: {
            alertId: params.alertId,
            fromStatus: existing.status as any,
            toStatus: params.toStatus,
            changedByUserId: params.changedByUserId
          }
        });

        return tx.alert.findUnique({
          where: { id: params.alertId }
        });
      });
    },

    async findEscalatableCriticalAlerts(now: Date) {
      return prisma.alert.findMany({
        where: {
          status: "OPEN",
          severity: "CRITICAL",
          suppressed: false,
          escalatedAt: null,
          createdAt: { lte: new Date(now.getTime() - 5 * 60 * 1000) }
        },
        select: {
          id: true,
          assignedToUserId: true,
          zoneId: true,
          sensorId: true
        }
      });
    },

    async escalateAlertOnce(params: {
      alertId: string;
      toUserId: string;
      escalatedAt: Date;
      fromUserId: string | null;
    }) {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.alert.updateMany({
          where: { id: params.alertId, escalatedAt: null },
          data: { escalatedAt: params.escalatedAt, assignedToUserId: params.toUserId }
        });
        if (updated.count !== 1) return null;

        // Unique(alertId) guarantees exactly-once escalation record.
        await tx.escalationLog.create({
          data: {
            alertId: params.alertId,
            escalatedAt: params.escalatedAt,
            fromUserId: params.fromUserId ?? undefined,
            toUserId: params.toUserId
          }
        });

        return tx.alert.findUnique({ where: { id: params.alertId } });
      });
    },

    async findOpenSilenceAlertsBySensorIds(sensorIds: string[]) {
      if (sensorIds.length === 0) return [];
      return prisma.alert.findMany({
        where: {
          sensorId: { in: sensorIds },
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
          suppressed: false,
          anomaly: { type: "SILENCE" }
        },
        select: { id: true, sensorId: true, status: true }
      });
    }
  };
}

