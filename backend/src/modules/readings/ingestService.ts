import { z } from "zod";
import { prisma } from "../../database/prismaClient";
import { httpError } from "../../utils/errors";
import { ingestQueue, baseJobOptions } from "../../workers/queues";
import { createReadingRepository } from "./readingRepository";

const readingSchema = z.object({
  sensor_id: z.string().min(1),
  timestamp: z.coerce.date(),
  voltage: z.coerce.number(),
  current: z.coerce.number(),
  temperature: z.coerce.number(),
  status_code: z.coerce.number().int()
});

const ingestSchema = z.object({
  readings: z.array(readingSchema).min(1).max(1000)
});

export function createIngestService() {
  const repo = createReadingRepository();

  return {
    async ingest(input: unknown) {
      const parsed = ingestSchema.parse(input);

      // Ensure all sensors exist quickly
      const sensorIds = Array.from(new Set(parsed.readings.map((r) => r.sensor_id)));
      const sensors = await prisma.sensor.findMany({
        where: { id: { in: sensorIds } },
        select: { id: true }
      });
      const found = new Set(sensors.map((s) => s.id));
      const missing = sensorIds.filter((id) => !found.has(id));
      if (missing.length > 0) {
        throw httpError(400, "Unknown sensor_id in batch", "SENSOR_MISSING", {
          missing: missing.slice(0, 10)
        });
      }

      const batch = await prisma.ingestBatch.create({
        data: {
          readingCount: parsed.readings.length,
          status: "PENDING"
        }
      });

      // Bulk insert readings durably before response.
      await prisma.$transaction(async (tx) => {
        await repo.bulkInsertReadings(tx, batch.id, parsed.readings);
        await tx.ingestBatch.update({
          where: { id: batch.id },
          data: { status: "ENQUEUED" }
        });
      });

      // Enqueue anomaly detection asynchronously.
      await ingestQueue.add(
        "process_batch",
        { batchId: batch.id },
        { jobId: batch.id, ...baseJobOptions() }
      );

      return {
        batchId: batch.id,
        inserted: parsed.readings.length,
        queued: true
      };
    }
  };
}

