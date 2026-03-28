import { prisma } from "../database/prismaClient";
import { httpError } from "./errors";

export async function assertSensorInUserZones(
  user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
  sensorId: string
) {
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId },
    select: { id: true, zoneId: true }
  });
  if (!sensor) throw httpError(404, "Sensor not found", "SENSOR_NOT_FOUND");
  if (user.role === "OPERATOR" && !user.zoneIds.includes(sensor.zoneId)) {
    throw httpError(403, "Forbidden for this zone", "ZONE_FORBIDDEN");
  }
  return sensor;
}

export function zoneWhereClauseForUser(user: {
  role: "OPERATOR" | "SUPERVISOR";
  zoneIds: string[];
}) {
  if (user.role === "SUPERVISOR") return undefined;
  return { zoneId: { in: user.zoneIds } } as const;
}

