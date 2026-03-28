import { z } from "zod";
import { createSuppressionsRepository } from "./suppressionsRepository";
import { httpError } from "../../utils/errors";

const createSchema = z.object({
  sensorId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
});

export function createSuppressionsService() {
  const repo = createSuppressionsRepository();
  return {
    async listSuppressions(user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }) {
      return repo.listForUser(user);
    },
    async createSuppression(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      input: unknown
    ) {
      const parsed = createSchema.parse(input);
      if (parsed.endTime <= parsed.startTime) {
        throw httpError(400, "endTime must be after startTime");
      }
      return repo.createForUser(user, parsed.sensorId, parsed.startTime, parsed.endTime);
    }
  };
}

