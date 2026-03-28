import { prisma } from "../../database/prismaClient";
import { assertSensorInUserZones } from "../../utils/zoneAccess";
import { httpError } from "../../utils/errors";

export function createRulesRepository() {
  return {
    async getConfigForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string
    ) {
      await assertSensorInUserZones(user, sensorId);

      const config = await prisma.ruleConfig.findUnique({
        where: { sensorId }
      });
      if (!config) {
        throw httpError(404, "Rule config not found for sensor", "RULE_NOT_FOUND");
      }

      return {
        ...config,
        sensorId: config.sensorId
      };
    },

    async upsertConfigForUser(
      user: { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] },
      sensorId: string,
      config: {
        voltageMin: number;
        voltageMax: number;
        temperatureMin: number;
        temperatureMax: number;
        spikePercentVoltage: number;
        spikePercentTemperature: number;
        thresholdSeverityVoltage: "WARNING" | "CRITICAL";
        thresholdSeverityTemperature: "WARNING" | "CRITICAL";
        spikeSeverityVoltage: "WARNING" | "CRITICAL";
        spikeSeverityTemperature: "WARNING" | "CRITICAL";
        silenceSeverity: "WARNING" | "CRITICAL";
      }
    ) {
      await assertSensorInUserZones(user, sensorId);

      return prisma.ruleConfig.upsert({
        where: { sensorId },
        update: {
          voltageMin: config.voltageMin,
          voltageMax: config.voltageMax,
          temperatureMin: config.temperatureMin,
          temperatureMax: config.temperatureMax,
          spikePercentVoltage: config.spikePercentVoltage,
          spikePercentTemperature: config.spikePercentTemperature,
          thresholdSeverityVoltage: config.thresholdSeverityVoltage,
          thresholdSeverityTemperature: config.thresholdSeverityTemperature,
          spikeSeverityVoltage: config.spikeSeverityVoltage,
          spikeSeverityTemperature: config.spikeSeverityTemperature,
          silenceSeverity: config.silenceSeverity
        },
        create: {
          sensorId,
          voltageMin: config.voltageMin,
          voltageMax: config.voltageMax,
          temperatureMin: config.temperatureMin,
          temperatureMax: config.temperatureMax,
          spikePercentVoltage: config.spikePercentVoltage,
          spikePercentTemperature: config.spikePercentTemperature,
          thresholdSeverityVoltage: config.thresholdSeverityVoltage,
          thresholdSeverityTemperature: config.thresholdSeverityTemperature,
          spikeSeverityVoltage: config.spikeSeverityVoltage,
          spikeSeverityTemperature: config.spikeSeverityTemperature,
          silenceSeverity: config.silenceSeverity
        }
      });
    }
  };
}

