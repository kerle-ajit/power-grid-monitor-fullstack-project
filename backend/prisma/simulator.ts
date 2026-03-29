import { Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function startSimulator() {
  console.log("🚀 Starting Real-time Sensor Simulator (5s interval)...");

  // Auto-detect Redis host
  const ingestQueue = new Queue("ingest_batches", {
    connection: {
      host:
        process.env.REDIS_HOST ||
        (process.env.DOCKER_ENV === "true" ? "redis" : "localhost"),
      port: Number(process.env.REDIS_PORT) || 6379
    }
  });

  // Load sensors once
  const sensors = await prisma.sensor.findMany({
    select: { id: true }
  });

  if (sensors.length === 0) {
    console.error("❌ No sensors found in DB. Run seed first.");
    process.exit(1);
  }

  console.log(`📡 Loaded ${sensors.length} sensors.`);

  // Generate healthy or abnormal readings
  const generateReading = (sensorId: string) => {
    const anomaly = Math.random() < 0.2; // 20% anomaly rate

    return {
      sensorId,
      timestamp: new Date(),
      voltage: anomaly ? 260 + Math.random() * 30 : 215 + Math.random() * 10,
      current: anomaly ? 18 + Math.random() * 6 : 10 + Math.random(),
      temperature: anomaly ? 80 + Math.random() * 20 : 45 + Math.random() * 5,
      statusCode: anomaly ? 2 : 0
    };
  };

  // Emit batches every 5 seconds
  setInterval(async () => {
    try {
      // Pick 10 random sensorIds per cycle
      const selectedSensorIds = Array.from({ length: 10 }).map(() => {
        return sensors[Math.floor(Math.random() * sensors.length)].id;
      });

      const readings = selectedSensorIds.map((id) => generateReading(id));

      // 1️⃣ Create ingestBatch DB row first
      const batch = await prisma.ingestBatch.create({
        data: {
          readingCount: readings.length,
          status: "QUEUED"
        }
      });

      // 2️⃣ Push to queue WITH batchId (required by worker)
      await ingestQueue.add(
        "batch",
        {
          batchId: batch.id,
          readings
        },
        { attempts: 3 }
      );

      console.log(
        `📥 Live batch pushed — batchId=${batch.id}, readings=${readings.length}, time=${new Date().toLocaleTimeString()}`
      );
    } catch (err) {
      console.error("❌ Simulator error:", err);
    }
  }, 5000);
}

startSimulator()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());