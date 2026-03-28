import { apiClient } from "./axios";

export async function createSuppression(sensorId: string, startTime: string, endTime: string) {
  const { data } = await apiClient.post("/suppressions", {
    sensorId,
    startTime,
    endTime
  });
  return data;
}

