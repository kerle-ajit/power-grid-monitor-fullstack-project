import { z } from "zod";
import { createAlertsRepository } from "./alertsRepository";
import { updateSensorStateAndEmitIfChanged } from "../../utils/sensorState";
import { emitToZone } from "../../sockets/socketServer";
import type { AlertStatus } from "@prisma/client";
import { httpError } from "../../utils/errors";
import { prisma } from "../../database/prismaClient";

const listQuerySchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  includeSuppressed: z
    .coerce
    .boolean()
    .optional()
    .default(false)
});

export function createAlertsService() {
  const repo = createAlertsRepository();

  return {
    async listAlerts(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      query: unknown
    ) {
      const parsed = listQuerySchema.parse(query);
      return repo.listAlertsForUser(user, parsed);
    },

    async ackAlert(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      alertId: string
    ) {
      const alert = await repo.getAlertForUser(user, alertId);
      if (!alert) throw httpError(404, "Alert not found", "ALERT_NOT_FOUND");
      if (alert.status !== "OPEN") {
        throw httpError(400, "Alert cannot be acknowledged from this status", "ALERT_INVALID_TRANSITION");
      }

      const updated = await repo.transitionAlertStatus({
        alertId,
        fromStatus: "OPEN",
        toStatus: "ACKNOWLEDGED",
        changedByUserId: user.id
      });

      await updateSensorStateAndEmitIfChanged(alert.sensorId);
      if (updated) {
        if (!updated.suppressed) {
          emitToZone(alert.zoneId, "alert_event", {
            alertId: updated.id,
            anomalyId: updated.anomalyId,
            sensorId: updated.sensorId,
            zoneId: updated.zoneId,
            status: updated.status,
            severity: updated.severity,
            suppressed: updated.suppressed,
            createdAt: updated.createdAt?.toISOString?.() ?? updated.createdAt,
            updatedAt: updated.updatedAt?.toISOString?.() ?? updated.updatedAt
          });
        }
      }
      return { alertId, status: updated?.status ?? alert.status };
    },

    async resolveAlert(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      alertId: string
    ) {
      const alert = await repo.getAlertForUser(user, alertId);
      if (!alert) throw httpError(404, "Alert not found", "ALERT_NOT_FOUND");
      if (alert.status === "RESOLVED") {
        throw httpError(400, "Alert is already resolved", "ALERT_ALREADY_RESOLVED");
      }
      if (alert.status !== "OPEN" && alert.status !== "ACKNOWLEDGED") {
        throw httpError(400, "Alert cannot be resolved from this status", "ALERT_INVALID_TRANSITION");
      }

      const updated = await repo.resolveAlertDirectly({
        alertId,
        toStatus: "RESOLVED",
        changedByUserId: user.id,
        allowFrom: ["OPEN", "ACKNOWLEDGED"]
      });

      await updateSensorStateAndEmitIfChanged(alert.sensorId);
      if (updated && !updated.suppressed) {
        emitToZone(alert.zoneId, "alert_event", {
          alertId: updated.id,
          anomalyId: updated.anomalyId,
          sensorId: updated.sensorId,
          zoneId: updated.zoneId,
          status: updated.status,
          severity: updated.severity,
          suppressed: updated.suppressed,
          createdAt: updated.createdAt?.toISOString?.() ?? updated.createdAt,
          updatedAt: updated.updatedAt?.toISOString?.() ?? updated.updatedAt
        });
      }
      return updated ? { alertId: updated.id, status: updated.status } : { alertId, status: alert.status };
    },

    async createAlertForAnomaly(params: {
      anomalyId: string;
      sensorId: string;
      zoneId: string;
      severity: "WARNING" | "CRITICAL";
      suppressed: boolean;
    }) {
      // Assign to an operator in this zone (if any). Supervisor has global view.
      const operatorAssignment = await prisma.userZone.findFirst({
        where: { zoneId: params.zoneId },
        select: { userId: true }
      });

      const assignedToUserId = operatorAssignment?.userId ?? null;

      return repo.createAlertForAnomaly({
        anomalyId: params.anomalyId,
        sensorId: params.sensorId,
        zoneId: params.zoneId,
        severity: params.severity,
        suppressed: params.suppressed,
        assignedToUserId
      });
    },

    async autoEscalate(alertId: string, toUserId: string) {
      const now = new Date();
      const alert = await prisma.alert.findUnique({ where: { id: alertId } });
      if (!alert) return null;
      return repo.escalateAlertOnce({
        alertId,
        toUserId,
        escalatedAt: now,
        fromUserId: alert.assignedToUserId
      });
    },

    async resolveSilenceAlerts(
      alertIds: string[],
      resolvedByUserId: string
    ) {
      const results: string[] = [];
      for (const id of alertIds) {
        const a = await prisma.alert.findUnique({ where: { id } });
        if (!a) continue;
        if (a.status !== "OPEN" && a.status !== "ACKNOWLEDGED") continue;
        if (a.suppressed) continue; // suppressed silence alerts not shown; skip auto changes

        await repo.resolveAlertDirectly({
          alertId: id,
          toStatus: "RESOLVED",
          changedByUserId: resolvedByUserId,
          allowFrom: ["OPEN", "ACKNOWLEDGED"]
        });
        results.push(id);
      }
      return results;
    }
  };
}

