import dotenv from "dotenv";
dotenv.config();

import http from "http";
import morgan from "morgan";
import { env } from "./config/env";
import { createApp } from "./app";
import { createSocketServer } from "./sockets/socketServer";
import { startQueueScheduler } from "./workers/queues";
import { startIngestWorker } from "./workers/ingestWorker";
import { startSilentWorker } from "./workers/silentWorker";
import { startEscalationWorker } from "./workers/escalationWorker";
import { logger } from "./utils/logger";

async function bootstrap() {
  const app = createApp();
  app.use(morgan("dev"));

  const server = http.createServer(app);
  await createSocketServer(server);

  startQueueScheduler();
  startIngestWorker();
  startSilentWorker();
  startEscalationWorker();

  server.listen(env.PORT, () => {
    logger.info(`GridWatch backend listening on :${env.PORT}`);
  });
}

bootstrap().catch((e) => {
  logger.error("Failed to bootstrap backend", { error: String(e?.message ?? e) });
  process.exit(1);
});

