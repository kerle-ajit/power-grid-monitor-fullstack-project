import { prisma } from "../../database/prismaClient";
import { assertSensorInUserZones, zoneWhereClauseForUser } from "../../utils/zoneAccess";

export function createSuppressionsRepository() {
  return {
    async listForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }
    ) {
      const zoneWhere = zoneWhereClauseForUser(user);
      return prisma.suppression.findMany({
        where: zoneWhere ? { sensor: zoneWhere } : undefined,
        select: {
          id: true,
          sensorId: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          createdByUserId: true,
          sensor: {
            select: { name: true, zoneId: true }
          }
        },
        orderBy: { startTime: "desc" }
      });
    },

    async createForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string,
      startTime: Date,
      endTime: Date
    ) {
      await assertSensorInUserZones(user, sensorId);
      const created = await prisma.suppression.create({
        data: {
          sensorId,
          startTime,
          endTime,
          createdByUserId: user.id
        },
        select: {
          id: true,
          sensorId: true,
          startTime: true,
          endTime: true,
          createdAt: true
        }
      });
      return created;
    },

    async findActiveSuppressionsForSensorsAtTimestamp(params: {
      sensorIds: string[];
      timestamp: Date;
    }) {
      const suppressions = await prisma.suppression.findMany({
        where: {
          sensorId: { in: params.sensorIds },
          startTime: { lte: params.timestamp },
          endTime: { gte: params.timestamp }
        },
        select: { sensorId: true, startTime: true, endTime: true }
      });

      const activeSet = new Set(suppressions.map((s) => s.sensorId));
      return activeSet;
    },

    async findSuppressionsInRangeForSensors(params: {
      sensorIds: string[];
      from: Date;
      to: Date;
    }) {
      return prisma.suppression.findMany({
        where: {
          sensorId: { in: params.sensorIds },
          endTime: { gte: params.from },
          startTime: { lte: params.to }
        },
        select: { id: true, sensorId: true, startTime: true, endTime: true }
      });
    }
  };
}

