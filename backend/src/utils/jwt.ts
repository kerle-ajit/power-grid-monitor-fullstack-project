import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string; // user id
  role: "OPERATOR" | "SUPERVISOR";
  zoneIds?: string[];
};

export function signAccessToken(payload: JwtPayload, expiresInSeconds = 60 * 60) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded) {
    throw new Error("Invalid JWT");
  }
  const payload = decoded as JwtPayload;
  return payload;
}

