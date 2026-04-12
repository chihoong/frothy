import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mpsToKnots } from "@/analysis/metrics";
import { formatDuration } from "@/lib/format";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; source?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const source = params.source as "UPLOAD" | "STRAVA" | undefined;
  const limit = 20;

  const where = {
    userId: session.user.id,
    ...(source && { source }),
  };

  const [sessions, total] = await Promise.all([
    db.surfSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, source: true, startTime: true,
        durationSeconds: true, distanceMeters: true, maxSpeedMs: true,
        waveCount: true, processingState: true,
      },
    }),
    db.surfSession.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button render={<Link href="/upload" />} size="sm">
          Upload GPX
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">
          No sessions yet.{" "}
          <Link href="/upload" className="text-primary hover:underline">
            Upload your first session
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.title ?? "Surf session"}</p>
                    <Badge variant="outline" className="text-xs">
                      {s.source === "STRAVA" ? "Strava" : "Upload"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(s.startTime).toLocaleDateString("en-AU", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}{" "}
                    · {formatDuration(s.durationSeconds)}
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
                  ) : s.processingState === "FAILED" ? (
                    <span className="text-red-500">Failed</span>
                  ) : (
                    <span className="text-amber-500">Processing…</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" render={<Link href={`/sessions?page=${page - 1}`} />}>
                  Previous
                </Button>
              )}
              <span className="flex items-center text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" render={<Link href={`/sessions?page=${page + 1}`} />}>
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
