import { Worker } from "bullmq";
import IORedis from "ioredis";
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

uploadWorker.on("failed", (job, err) => {
  console.error(`Upload job ${job?.id} failed:`, err.message);
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
