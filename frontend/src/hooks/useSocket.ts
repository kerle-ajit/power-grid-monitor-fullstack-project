import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

type Handlers = {
  onSensorUpdate?: (payload: any) => void;
  onAlertCreated?: (payload: any) => void;
  onAlertUpdated?: (payload: any) => void;
  onEscalationEvent?: (payload: any) => void;
};

export function useSocket(handlers: Handlers) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.token) return;

    const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
    const socket = io(`${base}/ws`, {
      transports: ["websocket"],
      auth: { token: user.token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_zones", { zoneIds: user.zoneIds, role: user.role });
    });

    socket.on("sensor_update", (p) => handlers.onSensorUpdate?.(p));
    socket.on("sensor_state", (p) => handlers.onSensorUpdate?.(p));
    socket.on("alert_created", (p) => handlers.onAlertCreated?.(p));
    socket.on("alert_updated", (p) => handlers.onAlertUpdated?.(p));
    socket.on("alert_event", (p) => handlers.onAlertUpdated?.(p));
    socket.on("escalation_event", (p) => handlers.onEscalationEvent?.(p));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handlers.onAlertCreated, handlers.onAlertUpdated, handlers.onEscalationEvent, handlers.onSensorUpdate, user]);

  return socketRef.current;
}

