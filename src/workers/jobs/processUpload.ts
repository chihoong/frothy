import { db } from "@/lib/db";
import { downloadFile } from "@/lib/s3";
import { parseGpxBuffer } from "@/analysis/gpx";
import { detectWaves } from "@/analysis/waveDetector";
import type { ProcessUploadJob } from "@/lib/queue";

export async function processUpload(data: ProcessUploadJob) {
  const { sessionId, rawFileKey } = data;

  await db.surfSession.update({
    where: { id: sessionId },
    data: { processingState: "PROCESSING" },
  });

  try {
    const fileBuffer = await downloadFile(rawFileKey);
    const xmlString = fileBuffer.toString("utf-8");
    console.log(`[processUpload] file size: ${fileBuffer.length} bytes, first 200 chars: ${JSON.stringify(xmlString.slice(0, 200))}`);
    const parsed = parseGpxBuffer(xmlString);
    const waves = detectWaves(parsed.trackpoints);

    await db.$transaction(async (tx) => {
      // Update session with parsed metadata
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

      // Bulk insert trackpoints in batches of 1000
      const BATCH = 1000;
      for (let i = 0; i < parsed.trackpoints.length; i += BATCH) {
        await tx.trackpoint.createMany({
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

      // Insert detected waves
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.surfSession.update({
      where: { id: sessionId },
      data: { processingState: "FAILED", processingError: message },
    });
    throw err;
  }
}
