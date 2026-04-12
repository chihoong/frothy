import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionMap } from "@/components/map/SessionMap";
import { SpeedChart } from "@/components/charts/SpeedChart";
import { WaveList } from "@/components/sessions/WaveList";
import { mpsToKnots } from "@/analysis/metrics";
import { formatDuration } from "@/lib/format";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      waves: { orderBy: { waveNumber: "asc" } },
      trackpoints: {
        orderBy: { recordedAt: "asc" },
        select: { lat: true, lng: true, speedMs: true, recordedAt: true },
      },
    },
  });

  if (!surfSession) notFound();

  // Downsample for map (every 5th point)
  const mapTrackpoints = surfSession.trackpoints.filter((_, i) => i % 5 === 0);

  const stats = [
    { label: "Waves", value: surfSession.waveCount },
    { label: "Duration", value: formatDuration(surfSession.durationSeconds) },
    {
      label: "Top speed",
      value: `${mpsToKnots(surfSession.maxSpeedMs).toFixed(1)} kts`,
    },
    {
      label: "Distance",
      value: `${(surfSession.distanceMeters / 1000).toFixed(2)} km`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">
            {surfSession.title ?? "Surf session"}
          </h1>
          <Badge variant="outline">
            {surfSession.source === "STRAVA" ? "Strava" : "Upload"}
          </Badge>
        </div>
        <p className="text-gray-500">
          {new Date(surfSession.startTime).toLocaleDateString("en-AU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
          {" · "}
          {new Date(surfSession.startTime).toLocaleTimeString("en-AU", {
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map */}
      {mapTrackpoints.length > 0 && surfSession.centerLat && surfSession.centerLng && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Track</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
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
          </CardContent>
        </Card>
      )}

      {/* Speed chart */}
      {surfSession.trackpoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Speed over time</CardTitle>
          </CardHeader>
          <CardContent>
            <SpeedChart
              trackpoints={surfSession.trackpoints.map((tp) => ({
                recordedAt: tp.recordedAt.toISOString(),
                speedMs: tp.speedMs,
              }))}
              waves={surfSession.waves.map((w) => ({
                startTime: w.startTime.toISOString(),
                endTime: w.endTime.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Wave list */}
      {surfSession.waves.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Waves ({surfSession.waveCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <WaveList waves={surfSession.waves} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
