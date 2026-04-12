import { db } from "@/lib/db";
import { getActivity, getActivityStreams } from "@/lib/strava/client";
import { detectWaves } from "@/analysis/waveDetector";
import type { StravaSyncJob } from "@/lib/queue";
import type { NormalizedTrackpoint } from "@/analysis/gpx";

export async function stravaSync(data: StravaSyncJob) {
  const { stravaActivityId, stravaAthleteId } = data;

  const token = await db.stravaToken.findUnique({
    where: { athleteId: stravaAthleteId },
  });
  if (!token) {
    console.warn(`No user found for Strava athlete ${stravaAthleteId}`);
    return;
  }

  const userId = token.userId;
  const activity = await getActivity(userId, stravaActivityId);

  // Only process surfing activities
  if (activity.sport_type !== "Surfing") return;

  // Idempotency check
  const existing = await db.surfSession.findFirst({
    where: { userId, source: "STRAVA", sourceId: String(stravaActivityId) },
  });
  if (existing?.processingState === "COMPLETE") return;

  const streams = await getActivityStreams(userId, stravaActivityId);

  const latLngs = streams.latlng?.data ?? [];
  const times = streams.time?.data ?? [];
  const speeds = streams.velocity_smooth?.data ?? [];
  const altitudes = streams.altitude?.data ?? [];

  if (latLngs.length < 2) {
    console.warn(`Strava activity ${stravaActivityId} has no GPS data`);
    return;
  }

  const startDate = new Date(activity.start_date);
  const trackpoints: NormalizedTrackpoint[] = latLngs.map(([lat, lng], i) => ({
    recordedAt: new Date(startDate.getTime() + (times[i] ?? i) * 1000),
    lat,
    lng,
    altitudeM: altitudes[i] ?? null,
    speedMs: speeds[i] ?? null,
    heartRate: null,
  }));

  const waves = detectWaves(trackpoints);
  const startTime = trackpoints[0].recordedAt;
  const endTime = trackpoints[trackpoints.length - 1].recordedAt;
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  let totalSpeed = 0;
  let maxSpeedMs = 0;
  let totalDist = 0;
  for (const tp of trackpoints) {
    minLat = Math.min(minLat, tp.lat);
    maxLat = Math.max(maxLat, tp.lat);
    minLng = Math.min(minLng, tp.lng);
    maxLng = Math.max(maxLng, tp.lng);
    if (tp.speedMs) {
      totalSpeed += tp.speedMs;
      maxSpeedMs = Math.max(maxSpeedMs, tp.speedMs);
    }
  }
  totalDist = activity.distance;

  await db.$transaction(async (tx) => {
    const surfSession = await tx.surfSession.upsert({
      where: {
        userId_source_sourceId: {
          userId,
          source: "STRAVA",
          sourceId: String(stravaActivityId),
        },
      },
      create: {
        userId,
        source: "STRAVA",
        sourceId: String(stravaActivityId),
        title: activity.name,
        startTime,
        endTime,
        durationSeconds: Math.round(durationSeconds),
        distanceMeters: totalDist,
        maxSpeedMs,
        avgSpeedMs: trackpoints.length > 0 ? totalSpeed / trackpoints.length : 0,
        waveCount: waves.length,
        centerLat: (minLat + maxLat) / 2,
        centerLng: (minLng + maxLng) / 2,
        boundingBox: { north: maxLat, south: minLat, east: maxLng, west: minLng },
        processingState: "COMPLETE",
      },
      update: {
        title: activity.name,
        startTime,
        endTime,
        durationSeconds: Math.round(durationSeconds),
        distanceMeters: totalDist,
        maxSpeedMs,
        avgSpeedMs: trackpoints.length > 0 ? totalSpeed / trackpoints.length : 0,
        waveCount: waves.length,
        centerLat: (minLat + maxLat) / 2,
        centerLng: (minLng + maxLng) / 2,
        boundingBox: { north: maxLat, south: minLat, east: maxLng, west: minLng },
        processingState: "COMPLETE",
      },
    });

    // Clear and re-insert trackpoints + waves
    await tx.trackpoint.deleteMany({ where: { sessionId: surfSession.id } });
    await tx.wave.deleteMany({ where: { sessionId: surfSession.id } });

    const BATCH = 1000;
    for (let i = 0; i < trackpoints.length; i += BATCH) {
      await tx.trackpoint.createMany({
        data: trackpoints.slice(i, i + BATCH).map((tp) => ({
          sessionId: surfSession.id,
          recordedAt: tp.recordedAt,
          lat: tp.lat,
          lng: tp.lng,
          altitudeM: tp.altitudeM,
          speedMs: tp.speedMs,
          heartRate: null,
        })),
      });
    }

    if (waves.length > 0) {
      await tx.wave.createMany({
        data: waves.map((w) => ({
          sessionId: surfSession.id,
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
}
