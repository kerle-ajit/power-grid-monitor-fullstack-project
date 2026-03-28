import { Worker } from "bullmq";
import { env } from "../config/env";
import { escalationQueue, getRedisConnection } from "./queues";
import { createAlertsRepository } from "../modules/alerts/alertsRepository";
import { prisma } from "../database/prismaClient";
import { emitToZone } from "../sockets/socketServer";

export async function runEscalationSweep() {
  const repo = createAlertsRepository();
  const now = new Date();
  const escalatable = await repo.findEscalatableCriticalAlerts(now);
  if (!escalatable.length) return;

  const supervisor = await prisma.user.findFirst({
    where: { role: "SUPERVISOR" },
    select: { id: true }
  });
  if (!supervisor) return;

  for (const a of escalatable) {
    const updated = await repo.escalateAlertOnce({
      alertId: a.id,
      fromUserId: a.assignedToUserId ?? null,
      toUserId: supervisor.id,
      escalatedAt: now
    });
    if (!updated) continue;

    emitToZone(a.zoneId, "alert_event", {
      alertId: updated.id,
      anomalyId: updated.anomalyId,
      sensorId: updated.sensorId,
      zoneId: updated.zoneId,
      status: updated.status,
      severity: updated.severity,
      suppressed: updated.suppressed,
      escalatedAt: updated.escalatedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  }
}

export function startEscalationWorker() {
  const connection = getRedisConnection();
  const worker = new Worker(
    env.ESCALATION_QUEUE_NAME,
    async () => {
      await runEscalationSweep();
    },
    { connection, concurrency: 1 }
  );

  escalationQueue.add(
    "sweep",
    {},
    { repeat: { every: 30_000 }, removeOnComplete: true, removeOnFail: 100 }
  ).catch(() => undefined);

  return worker;
}

