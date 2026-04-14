import { NormalizedTrackpoint } from "./gpx";
import { haversine, bearing, bearingDiff, medianBearing } from "./metrics";

export const WAVE_SPEED_THRESHOLD_MS = 2.5;
export const BEARING_TOLERANCE_DEG = 60;
export const MAX_GAP_SECONDS = 3;
export const MIN_WAVE_DURATION_S = 4;
export const MAX_WAVE_DURATION_S = 90;
export const MIN_WAVE_DISTANCE_M = 15;
export const MIN_WAVE_GAP_S = 20;

export type WaveDetectionParams = {
  speedThresholdMs?: number;
  bearingToleranceDeg?: number;
  maxGapSeconds?: number;
  minWaveDurationS?: number;
  maxWaveDurationS?: number;
  minWaveDistanceM?: number;
  minWaveGapS?: number;
};

export type DetectedWave = {
  waveNumber: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  distanceMeters: number;
  maxSpeedMs: number;
  avgSpeedMs: number;
  bearing: number | null;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

type Segment = {
  startIdx: number;
  endIdx: number;
};

export function detectWaves(
  trackpoints: NormalizedTrackpoint[],
  params: WaveDetectionParams = {}
): DetectedWave[] {
  if (trackpoints.length < 2) return [];

  const p = {
    speedThresholdMs: params.speedThresholdMs ?? WAVE_SPEED_THRESHOLD_MS,
    bearingToleranceDeg: params.bearingToleranceDeg ?? BEARING_TOLERANCE_DEG,
    maxGapSeconds: params.maxGapSeconds ?? MAX_GAP_SECONDS,
    minWaveDurationS: params.minWaveDurationS ?? MIN_WAVE_DURATION_S,
    maxWaveDurationS: params.maxWaveDurationS ?? MAX_WAVE_DURATION_S,
    minWaveDistanceM: params.minWaveDistanceM ?? MIN_WAVE_DISTANCE_M,
    minWaveGapS: params.minWaveGapS ?? MIN_WAVE_GAP_S,
  };

  // Precompute per-gap speed and bearing
  const gaps = computeGaps(trackpoints);

  // Two-pass: first without bearing filter to infer shore bearing
  const candidateSegments = findSegments(trackpoints, gaps, null, p);
  if (candidateSegments.length === 0) return [];

  const candidateBearings = candidateSegments.map((seg) =>
    computeSegmentBearing(trackpoints, gaps, seg)
  );
  const shoreBearing = medianBearing(candidateBearings.filter((b): b is number => b !== null));

  // Second pass with bearing filter
  const segments = findSegments(trackpoints, gaps, shoreBearing, p);
  const merged = mergeNearbySegments(trackpoints, segments, p);
  const filtered = filterSegments(trackpoints, gaps, merged, p);

  return filtered.map((seg, i) => buildWave(trackpoints, gaps, seg, i + 1));
}

type Gap = { speedMs: number; bearing: number; distanceM: number; dtSeconds: number };

function computeGaps(pts: NormalizedTrackpoint[]): Gap[] {
  const gaps: Gap[] = [];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const distM = haversine(prev.lat, prev.lng, curr.lat, curr.lng);
    const dtS = Math.max(
      (curr.recordedAt.getTime() - prev.recordedAt.getTime()) / 1000,
      0.001
    );
    const speedMs = curr.speedMs ?? distM / dtS;
    const bear = bearing(prev.lat, prev.lng, curr.lat, curr.lng);
    gaps.push({ speedMs, bearing: bear, distanceM: distM, dtSeconds: dtS });
  }
  return gaps;
}

type ResolvedParams = Required<WaveDetectionParams>;

function findSegments(
  pts: NormalizedTrackpoint[],
  gaps: Gap[],
  shoreBearing: number | null,
  p: ResolvedParams
): Segment[] {
  const segments: Segment[] = [];
  let segStart: number | null = null;
  let lastQualifiedIdx = -1;

  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i];
    const speedOk = gap.speedMs >= p.speedThresholdMs;
    const bearingOk =
      shoreBearing === null ||
      bearingDiff(gap.bearing, shoreBearing) <= p.bearingToleranceDeg;

    if (speedOk && bearingOk) {
      if (segStart === null) segStart = i;
      lastQualifiedIdx = i;
    } else if (segStart !== null) {
      const gapSince =
        (pts[i].recordedAt.getTime() -
          pts[lastQualifiedIdx + 1].recordedAt.getTime()) /
        1000;
      if (gapSince > p.maxGapSeconds) {
        segments.push({ startIdx: segStart, endIdx: lastQualifiedIdx + 1 });
        segStart = null;
      }
    }
  }

  if (segStart !== null) {
    segments.push({ startIdx: segStart, endIdx: lastQualifiedIdx + 1 });
  }

  return segments;
}

function mergeNearbySegments(
  pts: NormalizedTrackpoint[],
  segments: Segment[],
  p: ResolvedParams
): Segment[] {
  if (segments.length <= 1) return segments;
  const merged: Segment[] = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    const gapS =
      (pts[segments[i].startIdx].recordedAt.getTime() -
        pts[last.endIdx].recordedAt.getTime()) /
      1000;
    if (gapS <= p.minWaveGapS) {
      merged[merged.length - 1] = { startIdx: last.startIdx, endIdx: segments[i].endIdx };
    } else {
      merged.push(segments[i]);
    }
  }
  return merged;
}

function filterSegments(
  pts: NormalizedTrackpoint[],
  gaps: Gap[],
  segments: Segment[],
  p: ResolvedParams
): Segment[] {
  return segments.filter((seg) => {
    const startPt = pts[seg.startIdx];
    const endPt = pts[seg.endIdx];
    const durationS = (endPt.recordedAt.getTime() - startPt.recordedAt.getTime()) / 1000;
    if (durationS < p.minWaveDurationS || durationS > p.maxWaveDurationS) return false;

    let dist = 0;
    for (let i = seg.startIdx; i < seg.endIdx; i++) {
      dist += gaps[i]?.distanceM ?? 0;
    }
    return dist >= p.minWaveDistanceM;
  });
}

function computeSegmentBearing(
  pts: NormalizedTrackpoint[],
  gaps: Gap[],
  seg: Segment
): number | null {
  const startPt = pts[seg.startIdx];
  const endPt = pts[seg.endIdx];
  if (!startPt || !endPt) return null;
  return bearing(startPt.lat, startPt.lng, endPt.lat, endPt.lng);
}

function buildWave(
  pts: NormalizedTrackpoint[],
  gaps: Gap[],
  seg: Segment,
  waveNumber: number
): DetectedWave {
  const startPt = pts[seg.startIdx];
  const endPt = pts[seg.endIdx];
  const durationSeconds =
    (endPt.recordedAt.getTime() - startPt.recordedAt.getTime()) / 1000;

  let distanceMeters = 0;
  let maxSpeedMs = 0;
  let totalSpeed = 0;
  let speedCount = 0;

  for (let i = seg.startIdx; i < seg.endIdx; i++) {
    const gap = gaps[i];
    if (!gap) continue;
    distanceMeters += gap.distanceM;
    maxSpeedMs = Math.max(maxSpeedMs, gap.speedMs);
    totalSpeed += gap.speedMs;
    speedCount++;
  }

  const avgSpeedMs = speedCount > 0 ? totalSpeed / speedCount : 0;
  const waveBearing =
    startPt && endPt
      ? bearing(startPt.lat, startPt.lng, endPt.lat, endPt.lng)
      : null;

  return {
    waveNumber,
    startTime: startPt.recordedAt,
    endTime: endPt.recordedAt,
    durationSeconds,
    distanceMeters,
    maxSpeedMs,
    avgSpeedMs,
    bearing: waveBearing,
    startLat: startPt.lat,
    startLng: startPt.lng,
    endLat: endPt.lat,
    endLng: endPt.lng,
  };
}
