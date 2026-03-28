import { Worker } from "bullmq";
import { env } from "../config/env";
import { getRedisConnection } from "./queues";
import { prisma } from "../database/prismaClient";
import { processRuleABForBatch } from "./anomalyWorker";
import { logger } from "../utils/logger";

export function startIngestWorker() {
  const connection = getRedisConnection();

  const worker = new Worker(
    env.INGEST_QUEUE_NAME,
    async (job) => {
      const batchId: string = job.data.batchId;
      logger.info("Processing ingest batch", { batchId });

      await prisma.ingestBatch.update({
        where: { id: batchId },
        data: { status: "PROCESSING" }
      });

      try {
        await processRuleABForBatch(batchId);

        await prisma.ingestBatch.update({
          where: { id: batchId },
          data: { status: "PROCESSED", lastError: null }
        });
      } catch (e: any) {
        await prisma.ingestBatch.update({
          where: { id: batchId },
          data: { status: "FAILED", lastError: String(e?.message ?? e) }
        });
        throw e;
      }
    },
    {
      connection,
      concurrency: 5,
      lockDuration: 30000
    }
  );

  worker.on("failed", (job, err) => {
    logger.error("Ingest worker job failed", { jobId: job?.id, err: String(err?.message ?? err) });
  });

  return worker;
}

