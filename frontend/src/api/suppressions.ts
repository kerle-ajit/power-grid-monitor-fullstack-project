import { apiClient } from "./axios";

export type SuppressionEntry = {
  id: string;
  sensorId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdByUserId: string;
  sensor: {
    name: string;
    zoneId: string;
  };
};

export async function listSuppressions() {
  const { data } = await apiClient.get<SuppressionEntry[]>("/suppressions");
  return Array.isArray(data) ? data : [];
}

export async function createSuppression(sensorId: string, startTime: string, endTime: string) {
  const { data } = await apiClient.post("/suppressions", {
    sensorId,
    startTime,
    endTime
  });
  return data;
}
