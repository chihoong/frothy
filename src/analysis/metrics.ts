const EARTH_RADIUS_M = 6_371_000;

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function medianBearing(bearings: number[]): number {
  if (bearings.length === 0) return 0;
  // Convert to unit vectors, average, then convert back
  let sinSum = 0;
  let cosSum = 0;
  for (const b of bearings) {
    sinSum += Math.sin(toRad(b));
    cosSum += Math.cos(toRad(b));
  }
  return (toDeg(Math.atan2(sinSum / bearings.length, cosSum / bearings.length)) + 360) % 360;
}

export function bearingDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function mpsToKmh(mps: number): number {
  return mps * 3.6;
}

/**
 * Returns the highest average speed sustained over any window of at least
 * minWindowSeconds. This filters out sub-second GPS spikes that would
 * otherwise inflate the top speed figure.
 */
export function sustainedMaxSpeedMs(
  trackpoints: Array<{ recordedAt: Date; speedMs: number | null }>,
  minWindowSeconds = 5
): number {
  let maxAvg = 0;
  for (let i = 0; i < trackpoints.length; i++) {
    const t0 = trackpoints[i].recordedAt.getTime();
    let sum = 0;
    let count = 0;
    for (let j = i; j < trackpoints.length; j++) {
      const elapsed = (trackpoints[j].recordedAt.getTime() - t0) / 1000;
      const s = trackpoints[j].speedMs;
      if (s != null) {
        sum += s;
        count++;
      }
      if (elapsed >= minWindowSeconds) {
        if (count > 0) maxAvg = Math.max(maxAvg, sum / count);
        break;
      }
    }
  }
  return maxAvg;
}

export function mpsToKnots(mps: number): number {
  return mps * 1.94384;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
