import IORedis from "ioredis";
import { Queue, type JobsOptions } from "bullmq";
import { env } from "../config/env";

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export function getRedisConnection() {
  return connection;
}

export const ingestQueue = new Queue(env.INGEST_QUEUE_NAME, {
  connection
});

export const escalationQueue = new Queue(env.ESCALATION_QUEUE_NAME, {
  connection
});

export const silenceQueue = new Queue(env.SILENCE_QUEUE_NAME, {
  connection
});

export function baseJobOptions(): JobsOptions {
  return {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 }
  };
}

export function startQueueScheduler() {
  // BullMQ v5 handles delayed/repeat jobs without explicit QueueScheduler class.
  return;
}

