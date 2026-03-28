const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let token = "";

export function setToken(next: string) {
  token = next;
  localStorage.setItem("gw_token", next);
}

export function getToken() {
  if (token) return token;
  token = localStorage.getItem("gw_token") ?? "";
  return token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  me: () => request<{ id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }>("/auth/me"),
  sensors: () => request<{ sensors: any[] }>("/sensors"),
  alerts: () => request<{ alerts: any[]; totalCount: number; page: number; pageSize: number }>("/alerts?page=1&pageSize=100"),
  history: (sensorId: string, from: string, to: string) =>
    request<{ readings: any[] }>(
      `/sensors/${sensorId}/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page=1&pageSize=100`
    ),
  ackAlert: (alertId: string) => request(`/alerts/${alertId}/ack`, { method: "POST" }),
  resolveAlert: (alertId: string) => request(`/alerts/${alertId}/resolve`, { method: "POST" }),
  suppressions: () => request<any[]>("/suppressions"),
  createSuppression: (sensorId: string, startTime: string, endTime: string) =>
    request("/suppressions", {
      method: "POST",
      body: JSON.stringify({ sensorId, startTime, endTime })
    })
};

export { API_BASE };

