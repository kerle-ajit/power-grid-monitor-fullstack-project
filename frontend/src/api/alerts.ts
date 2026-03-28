import { apiClient } from "./axios";

export type AlertItem = {
  alertId: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  severity: "WARNING" | "CRITICAL";
  suppressed: boolean;
  createdAt: string;
  updatedAt: string;
  sensorId: string;
  zoneId: string;
  anomaly: {
    anomalyId: string;
    type: string;
    metric: string | null;
    timestamp: string;
    readingId: string | null;
  } | null;
};

export async function getAlerts(params?: { status?: string; includeSuppressed?: boolean; page?: number; pageSize?: number }) {
  const { data } = await apiClient.get<{ alerts: AlertItem[]; totalCount: number; page: number; pageSize: number }>("/alerts", {
    params
  });
  return data;
}

export async function acknowledgeAlert(alertId: string) {
  try {
    return (await apiClient.post(`/alerts/${alertId}/acknowledge`)).data;
  } catch {
    return (await apiClient.post(`/alerts/${alertId}/ack`)).data;
  }
}

export async function resolveAlert(alertId: string) {
  return (await apiClient.post(`/alerts/${alertId}/resolve`)).data;
}

