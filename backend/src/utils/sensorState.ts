import { prisma } from "../database/prismaClient";
import { emitToZone } from "../sockets/socketServer";
import type { SensorState, AlertStatus } from "@prisma/client";

const SILENCE_WINDOW_MS = 2 * 60 * 1000;
const ACTIVE_ALERT_STATUSES: AlertStatus[] = ["OPEN", "ACKNOWLEDGED"];

export async function computeSensorState(sensorId: string, now = new Date()): Promise<{ state: SensorState; zoneId: string }> {
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId },
    select: { id: true, zoneId: true }
  });
  if (!sensor) throw new Error("Sensor not found while computing state");

  const lastReading = await prisma.reading.findFirst({
    where: { sensorId },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true }
  });

  if (!lastReading || lastReading.timestamp.getTime() < now.getTime() - SILENCE_WINDOW_MS) {
    return { state: "SILENT", zoneId: sensor.zoneId };
  }

  const counts = await prisma.alert.groupBy({
    by: ["severity"],
    where: {
      sensorId,
      status: { in: ACTIVE_ALERT_STATUSES },
      suppressed: false
    }
  });

  const critical = counts.some((c) => c.severity === "CRITICAL");
  const warning = counts.some((c) => c.severity === "WARNING");

  if (critical) return { state: "CRITICAL", zoneId: sensor.zoneId };
  if (warning) return { state: "WARNING", zoneId: sensor.zoneId };
  return { state: "HEALTHY", zoneId: sensor.zoneId };
}

export async function updateSensorStateAndEmitIfChanged(sensorId: string, now = new Date()) {
  const { state, zoneId } = await computeSensorState(sensorId, now);

  const current = await prisma.sensorStateRow.findUnique({ where: { sensorId } });
  const currentState = current?.state;

  if (currentState === state) return { changed: false, state };

  await prisma.sensorStateRow.upsert({
    where: { sensorId },
    create: { sensorId, state, updatedAt: now },
    update: { state, updatedAt: now }
  });

  emitToZone(zoneId, "sensor_state", {
    sensorId,
    zoneId,
    state,
    updatedAt: now.toISOString()
  });

  return { changed: true, state };
}

