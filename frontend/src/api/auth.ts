import { jwtDecode } from "jwt-decode";
import { apiClient } from "./axios";

export type UserPayload = {
  sub: string;
  role: "OPERATOR" | "SUPERVISOR";
  zoneIds?: string[];
  exp: number;
};

export async function login(username: string, password: string) {
  const { data } = await apiClient.post<{ token: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[] }>(
    "/auth/login",
    { username, password }
  );
  const decoded = jwtDecode<UserPayload>(data.token);
  const user = {
    id: decoded.sub,
    role: decoded.role,
    zoneIds: decoded.zoneIds ?? [],
    token: data.token
  };
  localStorage.setItem("gw_token", data.token);
  localStorage.setItem("gw_user", JSON.stringify(user));
  return user;
}

export function getStoredUser() {
  const raw = localStorage.getItem("gw_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; role: "OPERATOR" | "SUPERVISOR"; zoneIds: string[]; token: string };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("gw_token");
  localStorage.removeItem("gw_user");
}

