import { db } from "@/lib/db";
import { downloadFile } from "@/lib/s3";
import { parseGpxBuffer } from "@/analysis/gpx";
import { detectWaves } from "@/analysis/waveDetector";
import type { ProcessUploadJob } from "@/lib/queue";

export async function processUpload(data: ProcessUploadJob) {
  const { sessionId, rawFileKey } = data;

  await db.surfSession.update({
    where: { id: sessionId },
    data: { processingState: "PROCESSING", processingError: null },
  });

  try {
    const fileBuffer = await downloadFile(rawFileKey);
    const parsed = parseGpxBuffer(fileBuffer.toString("utf-8"));
    const waves = detectWaves(parsed.trackpoints);

    // Child rows are inserted OUTSIDE the interactive transaction. A single
    // transaction holding tens of thousands of trackpoint inserts spikes worker
    // memory (the killer here — the process was OOM-killed mid-insert, leaving
    // the session stuck in PROCESSING) and risks Prisma's 5s interactive-txn
    // timeout. Clearing first makes retries idempotent (no duplicate rows from
    // a previously crashed attempt).
    await db.trackpoint.deleteMany({ where: { sessionId } });
    const BATCH = 1000;
    for (let i = 0; i < parsed.trackpoints.length; i += BATCH) {
      await db.trackpoint.createMany({
        data: parsed.trackpoints.slice(i, i + BATCH).map((tp) => ({
          sessionId,
          recordedAt: tp.recordedAt,
          lat: tp.lat,
          lng: tp.lng,
          altitudeM: tp.altitudeM,
          speedMs: tp.speedMs,
          heartRate: tp.heartRate,
        })),
      });
    }

    // Metadata + waves + the final COMPLETE flip happen together in one small,
    // fast transaction so the session only flips to COMPLETE once everything
    // downstream is durably written.
    await db.$transaction(async (tx) => {
      await tx.wave.deleteMany({ where: { sessionId } });
      if (waves.length > 0) {
        await tx.wave.createMany({
          data: waves.map((w) => ({
            sessionId,
            waveNumber: w.waveNumber,
            startTime: w.startTime,
            endTime: w.endTime,
            durationSeconds: w.durationSeconds,
            distanceMeters: w.distanceMeters,
            maxSpeedMs: w.maxSpeedMs,
            avgSpeedMs: w.avgSpeedMs,
            bearing: w.bearing,
            startLat: w.startLat,
            startLng: w.startLng,
            endLat: w.endLat,
            endLng: w.endLng,
          })),
        });
      }

      await tx.surfSession.update({
        where: { id: sessionId },
        data: {
          title: parsed.title,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          durationSeconds: Math.round(parsed.durationSeconds),
          distanceMeters: parsed.distanceMeters,
          maxSpeedMs: parsed.maxSpeedMs,
          avgSpeedMs: parsed.avgSpeedMs,
          waveCount: waves.length,
          centerLat: parsed.centerLat,
          centerLng: parsed.centerLng,
          boundingBox: parsed.boundingBox,
          processingState: "COMPLETE",
        },
      });
    });
  } catch (err) {
    // Log the full error — a bare err.message can be empty (it was, which made
    // the original stuck-in-PROCESSING failure undiagnosable from logs alone).
    const name = err instanceof Error ? err.constructor.name : typeof err;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`processUpload ${sessionId} failed [${name}]: ${message || "(empty message)"}`);
    if (err instanceof Error && err.stack) console.error(err.stack);

    // The FAILED write can itself fail (e.g. if the DB connection is wedged).
    // Guard it so that never masks the real error or crashes the worker.
    try {
      await db.surfSession.update({
        where: { id: sessionId },
        data: { processingState: "FAILED", processingError: `[${name}] ${message}`.slice(0, 1000) },
      });
    } catch (markErr) {
      console.error(`processUpload ${sessionId}: could not persist FAILED state:`, markErr);
    }
    throw err;
  }
}
