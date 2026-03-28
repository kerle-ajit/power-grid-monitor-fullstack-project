import { createAnomaliesRepository } from "./anomaliesRepository";
import { createAlertsService } from "../alerts/alertsService";

export function createAnomaliesService() {
  const anomaliesRepo = createAnomaliesRepository();
  const alertsService = createAlertsService();

  return {
    async createAnomalyAndAlert(params: {
      sensorId: string;
      readingId: string | null;
      zoneId: string;
      type: "THRESHOLD" | "SPIKE" | "SILENCE";
      metric: "VOLTAGE" | "TEMPERATURE" | null;
      timestamp: Date;
      severity: "WARNING" | "CRITICAL";
      suppressed: boolean;
      valueJson: any;
    }) {
      const anomaly = await anomaliesRepo.createAnomaly({
        sensorId: params.sensorId,
        readingId: params.readingId,
        type: params.type,
        metric: params.metric,
        timestamp: params.timestamp,
        severity: params.severity,
        suppressed: params.suppressed,
        valueJson: params.valueJson
      });

      const alert = await alertsService.createAlertForAnomaly({
        anomalyId: anomaly.id,
        sensorId: params.sensorId,
        zoneId: params.zoneId,
        severity: params.severity,
        suppressed: params.suppressed
      });

      return { anomaly, alert };
    }
  };
}

