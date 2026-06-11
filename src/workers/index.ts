import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "@/lib/db";
import { processUpload } from "./jobs/processUpload";
import { stravaSync } from "./jobs/stravaSync";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const uploadWorker = new Worker(
  "upload-processing",
  async (job) => {
    console.log(`Processing upload job ${job.id}`);
    await processUpload(job.data);
    console.log(`Upload job ${job.id} complete`);
  },
  { connection, concurrency: 3 }
);

const stravaWorker = new Worker(
  "strava-sync",
  async (job) => {
    console.log(`Processing Strava sync job ${job.id}`);
    await stravaSync(job.data);
    console.log(`Strava sync job ${job.id} complete`);
  },
  { connection, concurrency: 5 }
);

uploadWorker.on("failed", async (job, err) => {
  console.error(`Upload job ${job?.id} failed:`, err?.message);
  // Safety net: if the process was killed (OOM/redeploy) before processUpload's
  // own catch could run, processUpload leaves the session in PROCESSING. Once
  // BullMQ exhausts retries it moves the job to failed and emits this event on a
  // live worker — mark the session FAILED so it surfaces a RETRY instead of
  // hanging in PROCESSING forever.
  const attempts = job?.opts?.attempts ?? 1;
  const exhausted = !job || job.attemptsMade >= attempts;
  const sessionId = job?.data?.sessionId;
  if (exhausted && sessionId) {
    try {
      await db.surfSession.update({
        where: { id: sessionId },
        data: {
          processingState: "FAILED",
          processingError: err?.message || "Worker terminated during processing",
        },
      });
    } catch (e) {
      console.error(`Could not mark session ${sessionId} FAILED:`, e);
    }
  }
});

stravaWorker.on("failed", (job, err) => {
  console.error(`Strava sync job ${job?.id} failed:`, err.message);
});

console.log("Workers started");

process.on("SIGTERM", async () => {
  await uploadWorker.close();
  await stravaWorker.close();
  process.exit(0);
});
