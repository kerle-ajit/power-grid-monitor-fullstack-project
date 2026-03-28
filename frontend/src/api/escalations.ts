import { apiClient } from "./axios";

export type EscalationRow = {
  id: string;
  alertId: string;
  escalatedAt: string;
  fromUserId: string | null;
  toUserId: string | null;
  alert: {
    id: string;
    sensorId: string;
    zoneId: string;
    status: string;
    severity: string;
    suppressed: boolean;
  } | null;
};

export async function getEscalations() {
  const { data } = await apiClient.get<{ escalations: EscalationRow[] }>("/escalations");
  return data.escalations;
}
