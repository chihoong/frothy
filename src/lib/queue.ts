import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const uploadQueue = new Queue("upload-processing", { connection });
export const stravaQueue = new Queue("strava-sync", { connection });

export type ProcessUploadJob = {
  sessionId: string;
  userId: string;
  rawFileKey: string;
};

export type StravaSyncJob = {
  stravaActivityId: number;
  stravaAthleteId: number;
};
