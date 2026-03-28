import { prisma } from "../database/prismaClient";
import { updateSensorStateAndEmitIfChanged } from "../utils/sensorState";
import { emitToZone } from "../sockets/socketServer";
import { createAnomaliesService } from "../modules/anomalies/anomaliesService";
import { createSuppressionsRepository } from "../modules/suppressions/suppressionsRepository";

type ReadingRow = {
  id: string;
  sensorId: string;
  timestamp: Date;
  voltage: number;
  temperature: number;
  current: number;
  statusCode: number;
};

type RuleConfigRow = {
  sensorId: string;
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
};

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pctChangePercent(current: number, averagePrev: number) {
  if (averagePrev === 0) {
    if (current === 0) return 0;
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs((current - averagePrev) / averagePrev) * 100;
}

export async function processRuleABForBatch(batchId: string) {
  const anomaliesService = createAnomaliesService();
  const suppressionsRepo = createSuppressionsRepository();

  const readings = await prisma.reading.findMany({
    where: { batchId },
    orderBy: [{ sensorId: "asc" }, { timestamp: "asc" }],
    select: {
      id: true,
      sensorId: true,
      timestamp: true,
      voltage: true,
      current: true,
      temperature: true,
      statusCode: true
    }
  });

  if (readings.length === 0) return { processedSensors: 0, readings: 0 };

  const bySensor = new Map<string, ReadingRow[]>();
  for (const r of readings) {
    const arr = bySensor.get(r.sensorId) ?? [];
    arr.push({
      id: r.id,
      sensorId: r.sensorId,
      timestamp: r.timestamp,
      voltage: r.voltage,
      temperature: r.temperature,
      current: r.current,
      statusCode: r.statusCode
    });
    bySensor.set(r.sensorId, arr);
  }

  const sensorIds = Array.from(bySensor.keys());
  const sensors = await prisma.sensor.findMany({
    where: { id: { in: sensorIds } },
    select: { id: true, zoneId: true }
  });
  const sensorZoneById = new Map(sensors.map((s) => [s.id, s.zoneId]));

  const ruleConfigs = await prisma.ruleConfig.findMany({
    where: { sensorId: { in: sensorIds } }
  });
  const ruleBySensor = new Map<string, RuleConfigRow>(
    ruleConfigs.map((c) => [
      c.sensorId,
      {
        sensorId: c.sensorId,
        voltageMin: c.voltageMin,
        voltageMax: c.voltageMax,
        temperatureMin: c.temperatureMin,
        temperatureMax: c.temperatureMax,
        spikePercentVoltage: c.spikePercentVoltage,
        spikePercentTemperature: c.spikePercentTemperature,
        thresholdSeverityVoltage: c.thresholdSeverityVoltage as any,
        thresholdSeverityTemperature: c.thresholdSeverityTemperature as any,
        spikeSeverityVoltage: c.spikeSeverityVoltage as any,
        spikeSeverityTemperature: c.spikeSeverityTemperature as any,
        silenceSeverity: c.silenceSeverity as any
      }
    ])
  );

  // Prefetch suppressions in the batch time window to avoid N queries.
  const minTs = readings.reduce((min, r) => (r.timestamp < min ? r.timestamp : min), readings[0].timestamp);
  const maxTs = readings.reduce((max, r) => (r.timestamp > max ? r.timestamp : max), readings[0].timestamp);
  const suppressions = await suppressionsRepo.findSuppressionsInRangeForSensors({
    sensorIds,
    from: minTs,
    to: maxTs
  });
  const suppressionsBySensor = new Map<string, Array<{ startTime: Date; endTime: Date }>>();
  for (const s of suppressions) {
    const arr = suppressionsBySensor.get(s.sensorId) ?? [];
    arr.push({ startTime: s.startTime, endTime: s.endTime });
    suppressionsBySensor.set(s.sensorId, arr);
  }

  const getIsSuppressed = (sensorId: string, timestamp: Date) => {
    const windows = suppressionsBySensor.get(sensorId) ?? [];
    for (const w of windows) {
      if (w.startTime.getTime() <= timestamp.getTime() && w.endTime.getTime() >= timestamp.getTime()) {
        return true;
      }
    }
    return false;
  };

  // Process each sensor independently to keep the "previous 3 readings" logic in-memory.
  const processedSensors: string[] = [];
  for (const sensorId of sensorIds) {
    const sensorReadings = bySensor.get(sensorId) ?? [];
    if (sensorReadings.length === 0) continue;

    const zoneId = sensorZoneById.get(sensorId);
    if (!zoneId) continue;

    const ruleConfig = ruleBySensor.get(sensorId);
    if (!ruleConfig) {
      // If config missing, skip detection for correctness rather than crashing the worker.
      continue;
    }

    const firstTs = sensorReadings[0].timestamp;
    const prev = await prisma.reading.findMany({
      where: { sensorId, timestamp: { lt: firstTs } },
      orderBy: { timestamp: "desc" },
      take: 3,
      select: { voltage: true, temperature: true }
    });
    const prevWindowVoltage = prev.map((p) => p.voltage).reverse();
    const prevWindowTemp = prev.map((p) => p.temperature).reverse();

    let vWindow = prevWindowVoltage.slice(-3);
    let tWindow = prevWindowTemp.slice(-3);

    for (const reading of sensorReadings) {
      const suppressed = getIsSuppressed(sensorId, reading.timestamp);

      // Rule A: threshold breach
      if (reading.voltage < ruleConfig.voltageMin || reading.voltage > ruleConfig.voltageMax) {
        const severity = ruleConfig.thresholdSeverityVoltage;
        const { anomaly, alert } = await anomaliesService.createAnomalyAndAlert({
          sensorId,
          readingId: reading.id,
          zoneId,
          type: "THRESHOLD",
          metric: "VOLTAGE",
          timestamp: reading.timestamp,
          severity,
          suppressed,
          valueJson: {
            value: reading.voltage,
            min: ruleConfig.voltageMin,
            max: ruleConfig.voltageMax
          }
        });

        if (!alert.suppressed) {
          emitToZone(zoneId, "alert_event", {
            alertId: alert.id,
            anomalyId: anomaly.id,
            sensorId,
            zoneId,
            status: alert.status,
            severity: alert.severity,
            suppressed: alert.suppressed,
            createdAt: alert.createdAt.toISOString(),
            updatedAt: alert.updatedAt.toISOString()
          });
        }
      }

      if (reading.temperature < ruleConfig.temperatureMin || reading.temperature > ruleConfig.temperatureMax) {
        const severity = ruleConfig.thresholdSeverityTemperature;
        const { anomaly, alert } = await anomaliesService.createAnomalyAndAlert({
          sensorId,
          readingId: reading.id,
          zoneId,
          type: "THRESHOLD",
          metric: "TEMPERATURE",
          timestamp: reading.timestamp,
          severity,
          suppressed,
          valueJson: {
            value: reading.temperature,
            min: ruleConfig.temperatureMin,
            max: ruleConfig.temperatureMax
          }
        });

        if (!alert.suppressed) {
          emitToZone(zoneId, "alert_event", {
            alertId: alert.id,
            anomalyId: anomaly.id,
            sensorId,
            zoneId,
            status: alert.status,
            severity: alert.severity,
            suppressed: alert.suppressed,
            createdAt: alert.createdAt.toISOString(),
            updatedAt: alert.updatedAt.toISOString()
          });
        }
      }

      // Rule B: spike based on average of previous 3 readings
      if (vWindow.length === 3 && tWindow.length === 3) {
        const vAvg = avg(vWindow);
        const tAvg = avg(tWindow);
        const vPct = pctChangePercent(reading.voltage, vAvg);
        const tPct = pctChangePercent(reading.temperature, tAvg);

        if (vPct > ruleConfig.spikePercentVoltage) {
          const severity = ruleConfig.spikeSeverityVoltage;
          const { anomaly, alert } = await anomaliesService.createAnomalyAndAlert({
            sensorId,
            readingId: reading.id,
            zoneId,
            type: "SPIKE",
            metric: "VOLTAGE",
            timestamp: reading.timestamp,
            severity,
            suppressed,
            valueJson: {
              value: reading.voltage,
              avgPrev: vAvg,
              spikePercent: vPct,
              thresholdPercent: ruleConfig.spikePercentVoltage
            }
          });
          if (!alert.suppressed) {
            emitToZone(zoneId, "alert_event", {
              alertId: alert.id,
              anomalyId: anomaly.id,
              sensorId,
              zoneId,
              status: alert.status,
              severity: alert.severity,
              suppressed: alert.suppressed,
              createdAt: alert.createdAt.toISOString(),
              updatedAt: alert.updatedAt.toISOString()
            });
          }
        }

        if (tPct > ruleConfig.spikePercentTemperature) {
          const severity = ruleConfig.spikeSeverityTemperature;
          const { anomaly, alert } = await anomaliesService.createAnomalyAndAlert({
            sensorId,
            readingId: reading.id,
            zoneId,
            type: "SPIKE",
            metric: "TEMPERATURE",
            timestamp: reading.timestamp,
            severity,
            suppressed,
            valueJson: {
              value: reading.temperature,
              avgPrev: tAvg,
              spikePercent: tPct,
              thresholdPercent: ruleConfig.spikePercentTemperature
            }
          });
          if (!alert.suppressed) {
            emitToZone(zoneId, "alert_event", {
              alertId: alert.id,
              anomalyId: anomaly.id,
              sensorId,
              zoneId,
              status: alert.status,
              severity: alert.severity,
              suppressed: alert.suppressed,
              createdAt: alert.createdAt.toISOString(),
              updatedAt: alert.updatedAt.toISOString()
            });
          }
        }
      }

      // Update rolling windows for Rule B.
      vWindow.push(reading.voltage);
      tWindow.push(reading.temperature);
      if (vWindow.length > 3) vWindow = vWindow.slice(-3);
      if (tWindow.length > 3) tWindow = tWindow.slice(-3);
    }

    processedSensors.push(sensorId);
    await updateSensorStateAndEmitIfChanged(sensorId);
  }

  return { processedSensors: processedSensors.length, readings: readings.length };
}

