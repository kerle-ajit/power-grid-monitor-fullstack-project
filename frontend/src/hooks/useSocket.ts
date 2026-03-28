import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

type Handlers = {
  onSensorState?: (payload: unknown) => void;
  onAlertEvent?: (payload: unknown) => void;
  onEscalationEvent?: (payload: unknown) => void;
};

/**
 * Connects to the same Socket.IO server as the backend (default path /socket.io on the API origin).
 * Server joins zone rooms after JWT auth; no client-side join emit required.
 */
export function useSocket(handlers: Handlers) {
  const { user } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.token) return;

    const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
    const socket = io(base, {
      transports: ["websocket"],
      auth: { token: user.token }
    });
    socketRef.current = socket;

    socket.on("sensor_state", (p) => handlersRef.current.onSensorState?.(p));
    socket.on("alert_event", (p) => handlersRef.current.onAlertEvent?.(p));
    socket.on("escalation_event", (p) => handlersRef.current.onEscalationEvent?.(p));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.token, user?.id]);

  return socketRef.current;
}
