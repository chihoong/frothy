import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { detectWaves, WaveDetectionParams } from "@/analysis/waveDetector";
import type { NormalizedTrackpoint } from "@/analysis/gpx";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, processingState: true },
  });

  if (!surfSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (surfSession.processingState !== "COMPLETE") {
    return NextResponse.json({ error: "Session is not fully processed" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const waveParams: WaveDetectionParams = {
    speedThresholdMs: body.speedThresholdMs,
    bearingToleranceDeg: body.bearingToleranceDeg,
    maxGapSeconds: body.maxGapSeconds,
    minWaveDurationS: body.minWaveDurationS,
    maxWaveDurationS: body.maxWaveDurationS,
    minWaveDistanceM: body.minWaveDistanceM,
    minWaveGapS: body.minWaveGapS,
  };

  // Fetch all trackpoints (undownsampled) for detection
  const trackpoints = await db.trackpoint.findMany({
    where: { sessionId: id },
    orderBy: { recordedAt: "asc" },
    select: { recordedAt: true, lat: true, lng: true, altitudeM: true, speedMs: true, heartRate: true },
  });

  const normalized: NormalizedTrackpoint[] = trackpoints.map((tp) => ({
    recordedAt: tp.recordedAt,
    lat: tp.lat,
    lng: tp.lng,
    altitudeM: tp.altitudeM,
    speedMs: tp.speedMs,
    heartRate: tp.heartRate,
  }));

  const waves = detectWaves(normalized, waveParams);

  await db.$transaction(async (tx) => {
    await tx.wave.deleteMany({ where: { sessionId: id } });

    if (waves.length > 0) {
      await tx.wave.createMany({
        data: waves.map((w) => ({
          sessionId: id,
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
      where: { id },
      data: { waveCount: waves.length },
    });
  });

  return NextResponse.json({ waveCount: waves.length });
}
