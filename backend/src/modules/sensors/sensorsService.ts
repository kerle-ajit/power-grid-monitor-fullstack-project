import { z } from "zod";
import { createSensorsRepository } from "./sensorsRepository";

const historyQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  page: z
    .coerce
    .number()
    .int()
    .min(1)
    .default(1),
  pageSize: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100)
});

export function createSensorsService() {
  const repo = createSensorsRepository();

  return {
    async listSensorsForUser(user: {
      id: string;
      role: "OPERATOR" | "SUPERVISOR";
      zoneIds: string[];
    }) {
      return repo.listSensorsForUser(user);
    },

    async getSensorHistory(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string,
      query: unknown
    ) {
      const parsed = historyQuerySchema.parse(query);
      if (parsed.to < parsed.from) {
        throw new Error("Invalid time window");
      }
      return repo.getSensorHistory(user, sensorId, parsed.from, parsed.to, parsed.page, parsed.pageSize);
    }
  };
}

