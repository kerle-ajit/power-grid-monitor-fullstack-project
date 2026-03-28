import { httpError } from "../../utils/errors";

export function createReadingRepository() {
  return {
    async bulkInsertReadings(
      tx: { reading: any },
      batchId: string,
      readings: Array<{
        sensor_id: string;
        timestamp: Date;
        voltage: number;
        current: number;
        temperature: number;
        status_code: number;
      }>
    ) {
      // Prisma createMany does efficient multi-row INSERT.
      // We keep this logic in the repository to make ingestion controller lean.
      try {
        const rows = readings.map((r) => ({
          sensorId: r.sensor_id,
          batchId,
          timestamp: r.timestamp,
          voltage: r.voltage,
          current: r.current,
          temperature: r.temperature,
          statusCode: r.status_code
        }));

        await tx.reading.createMany({
          data: rows
        });
      } catch (e) {
        throw httpError(500, "Failed to insert readings", "READING_INSERT_FAILED", {
          error: String(e)
        });
      }
    }
  };
}

