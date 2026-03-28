import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().default(4000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(8),

  INGEST_QUEUE_NAME: z.string().default("ingest_batches"),
  SILENCE_QUEUE_NAME: z.string().default("silence_scan"),
  ESCALATION_QUEUE_NAME: z.string().default("alert_escalation"),

  SOCKET_CORS_ORIGIN: z.string().default("*")
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

