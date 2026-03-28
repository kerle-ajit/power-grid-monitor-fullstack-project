import { prisma } from "../../database/prismaClient";

export function createAnomaliesRepository() {
  return {
    async createAnomaly(params: {
      sensorId: string;
      readingId: string | null;
      type: "THRESHOLD" | "SPIKE" | "SILENCE";
      metric: "VOLTAGE" | "TEMPERATURE" | null;
      timestamp: Date;
      severity: "WARNING" | "CRITICAL";
      suppressed: boolean;
      valueJson: any;
    }) {
      return prisma.anomaly.create({
        data: {
          sensorId: params.sensorId,
          readingId: params.readingId ?? undefined,
          type: params.type,
          metric: params.metric ?? undefined,
          timestamp: params.timestamp,
          severity: params.severity,
          suppressed: params.suppressed,
          valueJson: params.valueJson ?? undefined
        }
      });
    }
  };
}

