import { prisma } from "../../database/prismaClient";
import { assertSensorInUserZones } from "../../utils/zoneAccess";
import { httpError } from "../../utils/errors";

export function createSensorsRepository() {
  return {
    async listSensorsForUser(user: {
      id: string;
      role: "OPERATOR" | "SUPERVISOR";
      zoneIds: string[];
    }) {
      const where =
        user.role === "SUPERVISOR"
          ? {}
          : { zoneId: { in: user.zoneIds } };

      // Get the latest state per sensor and the last reading timestamp for a quick "healthy/warning/critical/silent" marker.
      const sensors = await prisma.sensor.findMany({
        where,
        select: {
          id: true,
          name: true,
          zoneId: true,
          state: {
            select: { state: true, updatedAt: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      const sensorIds = sensors.map((s) => s.id);
      if (sensorIds.length === 0) return { sensors: [] };

      const lastReadings = await prisma.reading.groupBy({
        by: ["sensorId"],
        where: { sensorId: { in: sensorIds } },
        _max: { timestamp: true }
      });

      const lastMap = new Map(lastReadings.map((r) => [r.sensorId, r._max.timestamp]));

      return {
        sensors: sensors.map((s) => ({
          id: s.id,
          name: s.name,
          zoneId: s.zoneId,
          state: s.state?.state ?? "HEALTHY",
          stateUpdatedAt: s.state?.updatedAt ?? new Date(0).toISOString(),
          lastReadingAt: lastMap.get(s.id) ?? null
        }))
      };
    },

    async getSensorHistory(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string,
      from: Date,
      to: Date,
      page: number,
      pageSize: number
    ) {
      await assertSensorInUserZones(user, sensorId);

      const skip = (page - 1) * pageSize;
      const [totalCount, readings] = await Promise.all([
        prisma.reading.count({
          where: {
            sensorId,
            timestamp: { gte: from, lte: to }
          }
        }),
        prisma.reading.findMany({
          where: {
            sensorId,
            timestamp: { gte: from, lte: to }
          },
          orderBy: { timestamp: "asc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            timestamp: true,
            voltage: true,
            current: true,
            temperature: true,
            statusCode: true
          }
        }),
      ]);

      const readingIds = readings.map((r) => r.id);
      const anomalies = readingIds.length
        ? await prisma.anomaly.findMany({
            where: {
              sensorId,
              readingId: { in: readingIds }
            },
            orderBy: { timestamp: "asc" },
            select: {
              id: true,
              type: true,
              metric: true,
              timestamp: true,
              severity: true,
              suppressed: true,
              readingId: true,
              alert: {
                select: {
                  id: true,
                  status: true,
                  severity: true,
                  suppressed: true
                }
              }
            }
          })
        : [];

      const anomaliesByReading = new Map<string, any[]>();
      for (const a of anomalies) {
        const rid = a.readingId!;
        const arr = anomaliesByReading.get(rid) ?? [];
        arr.push({
          anomalyId: a.id,
          type: a.type,
          metric: a.metric,
          severity: a.severity,
          suppressed: a.suppressed,
          timestamp: a.timestamp,
          alert: a.alert
        });
        anomaliesByReading.set(rid, arr);
      }

      const readingsPayload = readings.map((r) => {
        const arr = anomaliesByReading.get(r.id) ?? [];
        return {
          readingId: r.id,
          timestamp: r.timestamp,
          voltage: r.voltage,
          current: r.current,
          temperature: r.temperature,
          statusCode: r.statusCode,
          triggered: arr.length > 0,
          anomalies: arr
        };
      });

      if (!readingsPayload) {
        throw httpError(500, "Failed to build history payload");
      }

      return {
        page,
        pageSize,
        totalCount,
        readings: readingsPayload
      };
    }
  };
}

