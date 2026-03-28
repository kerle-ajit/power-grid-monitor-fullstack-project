import { z } from "zod";
import { createRulesRepository } from "./rulesRepository";
import { httpError } from "../../utils/errors";

const configSchema = z.object({
  voltageMin: z.coerce.number(),
  voltageMax: z.coerce.number(),
  temperatureMin: z.coerce.number(),
  temperatureMax: z.coerce.number(),

  spikePercentVoltage: z.coerce.number(),
  spikePercentTemperature: z.coerce.number(),

  thresholdSeverityVoltage: z.enum(["WARNING", "CRITICAL"]),
  thresholdSeverityTemperature: z.enum(["WARNING", "CRITICAL"]),
  spikeSeverityVoltage: z.enum(["WARNING", "CRITICAL"]),
  spikeSeverityTemperature: z.enum(["WARNING", "CRITICAL"]),
  silenceSeverity: z.enum(["WARNING", "CRITICAL"])
});

export function createRulesService() {
  const repo = createRulesRepository();

  return {
    async getConfig(user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }, sensorId: string) {
      return repo.getConfigForUser(user, sensorId);
    },

    async upsertConfig(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string,
      input: unknown
    ) {
      const config = configSchema.parse(input);
      if (config.voltageMin > config.voltageMax) throw httpError(400, "Invalid voltage range");
      if (config.temperatureMin > config.temperatureMax) throw httpError(400, "Invalid temperature range");

      return repo.upsertConfigForUser(user, sensorId, config);
    }
  };
}

