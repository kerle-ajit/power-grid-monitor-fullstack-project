import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../database/prismaClient";
import type { AlertStatus, SensorState } from "@prisma/client";

export type SensorStateEvent = {
  sensorId: string;
  zoneId: string;
  state: SensorState;
  updatedAt: string;
};

export type AlertEvent = {
  alertId: string;
  anomalyId?: string | null;
  sensorId: string;
  zoneId: string;
  status: AlertStatus;
  severity: string;
  suppressed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SocketAuthUser = {
  id: string;
  role: "OPERATOR" | "SUPERVISOR";
  zoneIds: string[];
};

const ZONE_ROOM_PREFIX = "zone:";

let io: SocketIOServer | null = null;

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function zoneRoom(zoneId: string) {
  return `${ZONE_ROOM_PREFIX}${zoneId}`;
}

export async function createSocketServer(httpServer: HttpServer) {
  const server = new SocketIOServer(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN,
      credentials: true
    }
  });

  server.on("connection", async (socket) => {
    try {
      const token =
        (socket.handshake.auth && (socket.handshake.auth as any).token) ||
        socket.handshake.headers?.authorization?.toString()?.replace("Bearer ", "");
      if (!token) {
        socket.disconnect(true);
        return;
      }
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true }
      });
      if (!user || user.role !== payload.role) {
        socket.disconnect(true);
        return;
      }

      let zoneIds: string[] = [];
      if (user.role === "OPERATOR") {
        const rows = await prisma.userZone.findMany({
          where: { userId: user.id },
          select: { zoneId: true }
        });
        zoneIds = rows.map((r) => r.zoneId);
      }

      const authUser: SocketAuthUser = {
        id: user.id,
        role: user.role,
        zoneIds
      };

      if (authUser.role === "SUPERVISOR") {
        const zones = await prisma.zone.findMany({ select: { id: true } });
        for (const z of zones) socket.join(zoneRoom(z.id));
      } else {
        for (const zId of authUser.zoneIds) socket.join(zoneRoom(zId));
      }

      socket.data.user = authUser;
    } catch {
      socket.disconnect(true);
    }
  });

  io = server;
  return server;
}

export function emitToZone(zoneId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(zoneRoom(zoneId)).emit(event, payload);
}

