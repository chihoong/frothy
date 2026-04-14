import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SessionMap } from "@/components/map/SessionMap";
import { SpeedChart } from "@/components/charts/SpeedChart";
import { WaveDetectionSettings } from "@/components/sessions/WaveDetectionSettings";
import { formatDuration, formatSpeed, speedUnitLabel, type SpeedUnit } from "@/lib/format";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const [surfSession, userPrefs] = await Promise.all([
    db.surfSession.findFirst({
      where: { id, userId: session.user.id },
      include: {
        waves: { orderBy: { waveNumber: "asc" } },
        trackpoints: {
          orderBy: { recordedAt: "asc" },
          select: { lat: true, lng: true, speedMs: true, recordedAt: true },
        },
      },
    }),
    db.user.findUnique({ where: { id: session.user.id }, select: { speedUnit: true } }),
  ]);

  if (!surfSession) notFound();

  const unit = (userPrefs?.speedUnit ?? "KNOTS") as SpeedUnit;

  const mapTrackpoints = surfSession.trackpoints.filter((_, i) => i % 5 === 0);

  const dateStr = new Date(surfSession.startTime)
    .toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
  const timeStr = new Date(surfSession.startTime)
    .toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  const stats = [
    { label: "Total Waves", value: String(surfSession.waveCount ?? "—"), unit: "COUNT" },
    { label: "Duration", value: formatDuration(surfSession.durationSeconds), unit: "H:MM:SS" },
    {
      label: "Top Speed",
      value: surfSession.maxSpeedMs ? formatSpeed(surfSession.maxSpeedMs, unit).split(" ")[0] : "—",
      unit: `${speedUnitLabel(unit).toUpperCase()} MAX`,
    },
    {
      label: "Distance",
      value: surfSession.distanceMeters ? (surfSession.distanceMeters / 1000).toFixed(2) : "—",
      unit: "KM TOTAL",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            <Link href="/sessions" className="hover:text-foreground transition-colors">Sessions</Link>
            {" / "}
            {dateStr}
          </p>
          <h1 className="text-sm uppercase tracking-wide font-medium">
            {surfSession.title ?? "Surf Session"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {surfSession.centerLat && surfSession.centerLng && (
            <p className="text-[10px] tracking-widest text-muted-foreground/60 uppercase hidden md:block">
              {surfSession.centerLat.toFixed(4)}° / {surfSession.centerLng.toFixed(4)}°
            </p>
          )}
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{timeStr}</p>
          <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${
            surfSession.source === "STRAVA"
              ? "border-muted-foreground/40 text-muted-foreground"
              : "border-border text-muted-foreground"
          }`}>
            {surfSession.source === "STRAVA" ? "Strava" : "Upload"}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 border-b border-border">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-6 py-5 ${i < 3 ? "border-r border-border" : ""}`}>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{s.label}</p>
            <p className="text-3xl font-light tracking-tight">{s.value}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 mt-1">{s.unit}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Map */}
        {mapTrackpoints.length > 0 && surfSession.centerLat && surfSession.centerLng && (
          <div className="border-b border-border">
            <div className="px-6 py-2 border-b border-border">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Track</p>
            </div>
            <div className="h-72">
              <SessionMap
                trackpoints={mapTrackpoints.map((tp) => ({
                  lat: tp.lat,
                  lng: tp.lng,
                  speedMs: tp.speedMs,
                }))}
                waves={surfSession.waves.map((w) => ({
                  startLat: w.startLat,
                  startLng: w.startLng,
                  endLat: w.endLat,
                  endLng: w.endLng,
                }))}
                centerLat={surfSession.centerLat}
                centerLng={surfSession.centerLng}
              />
            </div>
          </div>
        )}

        {/* Speed chart */}
        {surfSession.trackpoints.length > 0 && (
          <div className="border-b border-border">
            <div className="px-6 py-2 border-b border-border">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Speed Profile</p>
            </div>
            <div className="px-6 py-4">
              <SpeedChart
                trackpoints={surfSession.trackpoints.map((tp) => ({
                  recordedAt: tp.recordedAt.toISOString(),
                  speedMs: tp.speedMs,
                }))}
                waves={surfSession.waves.map((w) => ({
                  startTime: w.startTime.toISOString(),
                  endTime: w.endTime.toISOString(),
                }))}
                unit={unit}
              />
            </div>
          </div>
        )}

        {/* Wave breakdown table */}
        {surfSession.waves.length > 0 && (
          <div className="p-6">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
              Wave Breakdown — {surfSession.waveCount} Waves
            </p>
            <div className="border border-border">
              {/* Table header */}
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr] border-b border-border bg-muted/40">
                {["#", "Duration", "Distance", "Top Speed", "Avg Speed"].map((h) => (
                  <div key={h} className="px-4 py-2 text-[9px] tracking-widest uppercase text-muted-foreground">{h}</div>
                ))}
              </div>
              {surfSession.waves.map((w, i) => (
                <div
                  key={w.id}
                  className={`grid grid-cols-[2rem_1fr_1fr_1fr_1fr] ${i < surfSession.waves.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="px-4 py-3 text-[10px] text-muted-foreground/60">{w.waveNumber}</div>
                  <div className="px-4 py-3 text-xs">{w.durationSeconds.toFixed(0)}s</div>
                  <div className="px-4 py-3 text-xs">{w.distanceMeters.toFixed(0)} m</div>
                  <div className="px-4 py-3 text-xs font-medium">{formatSpeed(w.maxSpeedMs, unit)}</div>
                  <div className="px-4 py-3 text-xs text-muted-foreground">{formatSpeed(w.avgSpeedMs, unit)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Wave detection tuning */}
        {surfSession.processingState === "COMPLETE" && (
          <WaveDetectionSettings sessionId={surfSession.id} />
        )}
      </div>
    </div>
  );
}
