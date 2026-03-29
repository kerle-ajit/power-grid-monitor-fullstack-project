import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// ⬇️ ADD THESE IMPORTS AT TOP
import { Queue } from "bullmq";
import { createClient } from "redis";

const prisma = new PrismaClient();

async function main() {
  await prisma.escalationLog.deleteMany();
  await prisma.alertAuditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.ingestBatch.deleteMany();
  await prisma.suppression.deleteMany();
  await prisma.ruleConfig.deleteMany();
  await prisma.sensorStateRow.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.userZone.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  const zones = await prisma.$transaction([
    prisma.zone.create({ data: { name: "north" } }),
    prisma.zone.create({ data: { name: "south" } }),
    prisma.zone.create({ data: { name: "west" } })
  ]);

  const pass = await bcrypt.hash("password123", 10);
  const [operator1, operator2, supervisor] = await prisma.$transaction([
    prisma.user.create({ data: { username: "operator_north", passwordHash: pass, role: "OPERATOR" } }),
    prisma.user.create({ data: { username: "operator_south", passwordHash: pass, role: "OPERATOR" } }),
    prisma.user.create({ data: { username: "supervisor", passwordHash: pass, role: "SUPERVISOR" } })
  ]);

  await prisma.userZone.createMany({
    data: [
      { userId: operator1.id, zoneId: zones[0].id },
      { userId: operator2.id, zoneId: zones[1].id }
    ]
  });

  const sensorsData = Array.from({ length: 1000 }).map((_, i) => {
    const zone = zones[i % zones.length];
    return {
      id: `sensor-${String(i + 1).padStart(4, "0")}`,
      name: `Sensor ${i + 1}`,
      zoneId: zone.id
    };
  });

  for (let i = 0; i < sensorsData.length; i += 200) {
    await prisma.sensor.createMany({ data: sensorsData.slice(i, i + 200) });
  }

  for (let i = 0; i < sensorsData.length; i += 200) {
    const chunk = sensorsData.slice(i, i + 200);
    await prisma.ruleConfig.createMany({
      data: chunk.map((s) => ({
        sensorId: s.id,
        voltageMin: 210,
        voltageMax: 240,
        temperatureMin: 10,
        temperatureMax: 85,
        spikePercentVoltage: 15,
        spikePercentTemperature: 20,
        thresholdSeverityVoltage: "CRITICAL",
        thresholdSeverityTemperature: "WARNING",
        spikeSeverityVoltage: "WARNING",
        spikeSeverityTemperature: "WARNING",
        silenceSeverity: "CRITICAL"
      }))
    });
  }

  const now = Date.now();
  const start = now - 48 * 60 * 60 * 1000;
  const readingRows: Array<{
    sensorId: string;
    timestamp: Date;
    voltage: number;
    current: number;
    temperature: number;
    statusCode: number;
  }> = [];

  // 48 hours at 10-min intervals => 288 readings/sensor (~288k rows)
  for (const s of sensorsData) {
    for (let t = start; t <= now; t += 10 * 60 * 1000) {
      const drift = ((t - start) / (60 * 60 * 1000)) * 0.05;
      readingRows.push({
        sensorId: s.id,
        timestamp: new Date(t),
        voltage: 220 + Math.sin(t / 600000) * 5 + drift,
        current: 10 + Math.cos(t / 900000),
        temperature: 45 + Math.sin(t / 1200000) * 8,
        statusCode: 0
      });
    }
  }

  for (let i = 0; i < readingRows.length; i += 2000) {
    await prisma.reading.createMany({ data: readingRows.slice(i, i + 2000) });
  }

  await prisma.sensorStateRow.createMany({
    data: sensorsData.map((s) => ({ sensorId: s.id, state: "HEALTHY" })),
    skipDuplicates: true
  });

  // Introduce a few abnormal latest values so dashboard has immediate signals.
  const hotSensors = sensorsData.slice(0, 5);
  for (const s of hotSensors) {
    await prisma.reading.create({
      data: {
        sensorId: s.id,
        timestamp: new Date(now - 30_000),
        voltage: 280,
        current: 20,
        temperature: 95,
        statusCode: 2
      }
    });
  }

    // ---------------------------------------------------------
  // 🔥 LIVE TEST SEED FOR: WebSocket, Workers, Redis queues
  // ---------------------------------------------------------

  console.log("Creating live worker test batch...");

  // 1) Create Redis connection like workers
  const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  await redis.connect();

  // 2) Use BullMQ queue identical to backend usage
  const ingestQueue = new Queue("ingest_batches", {
    connection: {
      host: process.env.REDIS_HOST || "redis",
      port: Number(process.env.REDIS_PORT) || 6379
    }
  });

  // 3) Pick first 5 sensors for live test batch
  const liveSensors = sensorsData.slice(0, 5);

  // 4) Build a live anomaly-triggering reading batch
  const liveBatch = liveSensors.map((s) => ({
    sensorId: s.id,
    timestamp: new Date(),
    voltage: 300,             // triggers CRITICAL voltage anomaly
    current: 20,
    temperature: 95,          // triggers CRITICAL temperature anomaly
    statusCode: 2
  }));

  // 5) Push job to ingest queue
  await ingestQueue.add("batch", { readings: liveBatch });

  console.log("✔ Live ingest batch pushed to Redis queue.");
  console.log("✔ This will trigger anomaly worker + alert worker + WebSocket broadcast.");
  
  await redis.disconnect();

  console.log("Seed complete");
  console.log("Users:");
  console.log("- operator_north / password123");
  console.log("- operator_south / password123");
  console.log("- supervisor / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

