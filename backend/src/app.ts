import express from "express";
import cors from "cors";
import "express-async-errors";
import { env } from "./config/env";
import { httpError } from "./utils/errors";

import { authRouter } from "./modules/auth/routes";
import { ingestRouter } from "./modules/readings/routes";
import { sensorsRouter } from "./modules/sensors/routes";
import { alertsRouter } from "./modules/alerts/routes";
import { suppressionsRouter } from "./modules/suppressions/routes";
import { rulesRouter } from "./modules/rules/routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.SOCKET_CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/ingest", ingestRouter);
  app.use("/", sensorsRouter); // /sensors/...
  app.use("/alerts", alertsRouter);
  app.use("/suppressions", suppressionsRouter);
  app.use("/rules", rulesRouter);

  // 404
  app.use((_req, _res, _next) => {
    throw httpError(404, "Not Found");
  });

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    const code = err?.code ? String(err.code) : undefined;
    const message = status === 500 ? "Internal Server Error" : String(err?.message ?? "Error");
    const payload: any = { error: message };
    if (code) payload.code = code;
    if (env.NODE_ENV !== "production" && err?.details) payload.details = err.details;
    res.status(status).json(payload);
  });

  return app;
}

