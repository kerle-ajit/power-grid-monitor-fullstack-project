import { io, type Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(API_BASE, {
    transports: ["websocket"],
    auth: { token: getToken() }
  });
  return socket;
}

