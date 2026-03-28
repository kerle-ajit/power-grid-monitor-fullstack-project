import { apiClient } from "./axios";

export type Sensor = {
  id: string;
  name: string;
  zoneId: string;
  state: "HEALTHY" | "WARNING" | "CRITICAL" | "SILENT";
  stateUpdatedAt: string;
  lastReadingAt: string | null;
};

export type SensorHistoryRow = {
  readingId: string;
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  statusCode: number;
  triggered: boolean;
  anomalies: Array<{
    anomalyId: string;
    type: string;
    metric: string | null;
    severity: string;
    suppressed: boolean;
    timestamp: string;
    alert: {
      id: string;
      status: string;
      severity: string;
      suppressed: boolean;
    } | null;
  }>;
};

export async function getSensors() {
  const { data } = await apiClient.get<{ sensors: Sensor[] }>("/sensors");
  return data.sensors;
}

export async function getSensorHistory(sensorId: string, from: string, to: string, page = 1, pageSize = 100) {
  const { data } = await apiClient.get<{ page: number; pageSize: number; totalCount: number; readings: SensorHistoryRow[] }>(
    `/sensors/${sensorId}/history`,
    { params: { from, to, page, pageSize } }
  );
  return data;
}

