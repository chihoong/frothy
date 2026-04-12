import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { mpsToKnots } from "@/analysis/metrics";
import { formatDuration } from "@/lib/format";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [aggregate, recent] = await Promise.all([
    db.surfSession.aggregate({
      where: { userId, processingState: "COMPLETE" },
      _count: { id: true },
      _sum: { waveCount: true, durationSeconds: true },
      _max: { maxSpeedMs: true },
    }),
    db.surfSession.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        id: true, title: true, startTime: true, waveCount: true,
        maxSpeedMs: true, durationSeconds: true, processingState: true,
      },
    }),
  ]);

  const stats = [
    { label: "Sessions", value: aggregate._count.id },
    { label: "Total waves", value: aggregate._sum.waveCount ?? 0 },
    {
      label: "Best speed",
      value: aggregate._max.maxSpeedMs
        ? `${mpsToKnots(aggregate._max.maxSpeedMs).toFixed(1)} kts`
        : "—",
    },
    {
      label: "Time in water",
      value: formatDuration(aggregate._sum.durationSeconds ?? 0),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <h2 className="mb-3 text-lg font-semibold">Recent sessions</h2>
      {recent.length === 0 ? (
        <p className="text-gray-500">
          No sessions yet.{" "}
          <Link href="/upload" className="text-primary hover:underline">
            Upload your first GPX file
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {recent.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{s.title ?? "Surf session"}</p>
                <p className="text-sm text-gray-500">
                  {new Date(s.startTime).toLocaleDateString("en-AU", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right text-sm">
                {s.processingState === "COMPLETE" ? (
                  <>
                    <p className="font-medium">{s.waveCount} waves</p>
                    <p className="text-gray-500">
                      {mpsToKnots(s.maxSpeedMs).toFixed(1)} kts max
                    </p>
                  </>
                ) : s.processingState === "PROCESSING" || s.processingState === "PENDING" ? (
                  <span className="text-amber-500">Processing…</span>
                ) : (
                  <span className="text-red-500">Failed</span>
                )}
              </div>
            </Link>
          ))}
          <Link href="/sessions" className="block text-center text-sm text-primary hover:underline pt-2">
            View all sessions →
          </Link>
        </div>
      )}
    </div>
  );
}
