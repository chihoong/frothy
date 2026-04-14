import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { DOMParser } from "linkedom";
import type { Extensions } from "@we-gold/gpxjs";
import { haversine } from "./metrics";

export type NormalizedTrackpoint = {
  recordedAt: Date;
  lat: number;
  lng: number;
  altitudeM: number | null;
  speedMs: number | null;
  heartRate: number | null;
};

export type ParsedSession = {
  title: string | null;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  distanceMeters: number;
  maxSpeedMs: number;
  avgSpeedMs: number;
  centerLat: number;
  centerLng: number;
  boundingBox: { north: number; south: number; east: number; west: number };
  trackpoints: NormalizedTrackpoint[];
};

function getExtensionNumber(ext: Extensions, key: string): number | null {
  const val = ext[key];
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

const domParser = new DOMParser();

export function parseGpxBuffer(xmlString: string): ParsedSession {
  const parseMethod = (xml: string) => domParser.parseFromString(xml, "text/xml");
  const [gpx, error] = parseGPXWithCustomParser(xmlString, parseMethod as never);
  if (error) throw new Error(`GPX parse error: ${error.message}`);

  const track = gpx.tracks[0];
  if (!track) throw new Error("No tracks found in GPX file");

  const segment = track.points;
  if (segment.length < 2) throw new Error("GPX track has fewer than 2 points");

  const trackpoints: NormalizedTrackpoint[] = [];
  let totalDistance = 0;
  let totalSpeed = 0;
  let speedCount = 0;

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (let i = 0; i < segment.length; i++) {
    const pt = segment[i];
    if (!pt.time) continue;

    const lat = pt.latitude;
    const lng = pt.longitude;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);

    // Try device-recorded speed first (Garmin extensions: gpxtpx:speed in m/s)
    let speedMs: number | null = null;
    const ext = pt.extensions;
    if (ext) {
      const extSpeed = getExtensionNumber(ext, "speed");
      if (extSpeed !== null && extSpeed >= 0) {
        speedMs = extSpeed;
      }
    }

    if (speedMs === null && i > 0) {
      const prev = segment[i - 1];
      if (prev.time) {
        const dist = haversine(prev.latitude, prev.longitude, lat, lng);
        const dt = (pt.time.getTime() - prev.time.getTime()) / 1000;
        if (dt > 0) {
          speedMs = dist / dt;
          totalDistance += dist;
        }
      }
    }

    if (speedMs !== null && speedMs >= 0) {
      totalSpeed += speedMs;
      speedCount++;
    }

    let heartRate: number | null = null;
    if (ext) {
      heartRate = getExtensionNumber(ext, "hr") ?? getExtensionNumber(ext, "heartRate");
    }

    trackpoints.push({
      recordedAt: pt.time,
      lat,
      lng,
      altitudeM: pt.elevation,
      speedMs,
      heartRate,
    });
  }

  // Apply 3-point median filter to smooth speed noise
  const smoothed = applyMedianFilter(trackpoints);

  // Derive max speed from smoothed data to avoid GPS spike inflation
  const maxSpeedMs = smoothed.reduce(
    (max, tp) => (tp.speedMs != null ? Math.max(max, tp.speedMs) : max),
    0
  );

  const startTime = smoothed[0].recordedAt;
  const endTime = smoothed[smoothed.length - 1].recordedAt;
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

  return {
    title: track.name ?? null,
    startTime,
    endTime,
    durationSeconds,
    distanceMeters: totalDistance,
    maxSpeedMs,
    avgSpeedMs: speedCount > 0 ? totalSpeed / speedCount : 0,
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
    boundingBox: { north: maxLat, south: minLat, east: maxLng, west: minLng },
    trackpoints: smoothed,
  };
}

function applyMedianFilter(
  trackpoints: NormalizedTrackpoint[]
): NormalizedTrackpoint[] {
  return trackpoints.map((pt, i) => {
    if (pt.speedMs === null) return pt;
    const window = [
      i > 0 ? trackpoints[i - 1].speedMs : pt.speedMs,
      pt.speedMs,
      i < trackpoints.length - 1 ? trackpoints[i + 1].speedMs : pt.speedMs,
    ].filter((s): s is number => s !== null);
    window.sort((a, b) => a - b);
    return { ...pt, speedMs: window[Math.floor(window.length / 2)] };
  });
}
