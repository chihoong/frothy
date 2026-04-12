export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatSpeed(mps: number, unit: "kts" | "kmh" = "kts"): string {
  if (unit === "kts") return `${(mps * 1.94384).toFixed(1)} kts`;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}
