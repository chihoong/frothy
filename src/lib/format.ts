export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export type SpeedUnit = "KNOTS" | "KMH" | "MPH";

export function speedUnitLabel(unit: SpeedUnit): string {
  if (unit === "KMH") return "km/h";
  if (unit === "MPH") return "mph";
  return "kts";
}

export function formatSpeed(mps: number, unit: SpeedUnit): string {
  if (unit === "KMH") return `${(mps * 3.6).toFixed(1)} km/h`;
  if (unit === "MPH") return `${(mps * 2.23694).toFixed(1)} mph`;
  return `${(mps * 1.94384).toFixed(1)} kts`;
}
