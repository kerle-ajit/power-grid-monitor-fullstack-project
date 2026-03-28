import { Worker } from "bullmq";
import { env } from "../config/env";
import { getRedisConnection, silenceQueue } from "./queues";
import { prisma } from "../database/prismaClient";
import { createAnomaliesService } from "../modules/anomalies/anomaliesService";
import { createAlertsRepository } from "../modules/alerts/alertsRepository";
import { updateSensorStateAndEmitIfChanged } from "../utils/sensorState";
import { emitToZone } from "../sockets/socketServer";

const SILENCE_MS = 2 * 60 * 1000;

export async function scanForSilentSensors() {
  const now = new Date();
  const anomaliesService = createAnomaliesService();
  const alertsRepo = createAlertsRepository();

  const sensors = await prisma.sensor.findMany({
    select: { id: true, zoneId: true, rule: { select: { silenceSeverity: true } } }
  });
  if (!sensors.length) return;

  const cutoff = new Date(now.getTime() - SILENCE_MS);
  const lastBySensor = await prisma.reading.groupBy({
    by: ["sensorId"],
    _max: { timestamp: true },
    where: { sensorId: { in: sensors.map((s) => s.id) } }
  });
  const lastMap = new Map(lastBySensor.map((r) => [r.sensorId, r._max.timestamp]));

  const silent = sensors.filter((s) => {
    const ts = lastMap.get(s.id);
    return !ts || ts < cutoff;
  });

  const existing = await alertsRepo.findOpenSilenceAlertsBySensorIds(silent.map((s) => s.id));
  const existingSet = new Set(existing.map((e) => e.sensorId));

  for (const sensor of silent) {
    if (existingSet.has(sensor.id)) {
      await updateSensorStateAndEmitIfChanged(sensor.id, now);
      continue;
    }
    const severity = sensor.rule?.silenceSeverity ?? "WARNING";

    const { anomaly, alert } = await anomaliesService.createAnomalyAndAlert({
      sensorId: sensor.id,
      readingId: null,
      zoneId: sensor.zoneId,
      type: "SILENCE",
      metric: null,
      timestamp: now,
      severity: severity as "WARNING" | "CRITICAL",
      suppressed: false,
      valueJson: { reason: "No readings for >2 minutes", cutoff: cutoff.toISOString() }
    });

    if (!alert.suppressed) {
      emitToZone(sensor.zoneId, "alert_event", {
        alertId: alert.id,
        anomalyId: anomaly.id,
        sensorId: sensor.id,
        zoneId: sensor.zoneId,
        status: alert.status,
        severity: alert.severity,
        suppressed: alert.suppressed,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString()
      });
    }
    await updateSensorStateAndEmitIfChanged(sensor.id, now);
  }
}

export function startSilentWorker() {
  const connection = getRedisConnection();
  const worker = new Worker(
    env.SILENCE_QUEUE_NAME,
    async () => {
      await scanForSilentSensors();
    },
    { connection, concurrency: 1 }
  );

  // Run continuously every 30s independent of incoming ingest batches.
  silenceQueue.add(
    "scan",
    {},
    { repeat: { every: 30_000 }, removeOnComplete: true, removeOnFail: 100 }
  ).catch(() => undefined);

  return worker;
}

