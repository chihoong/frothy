import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatSpeed, type SpeedUnit } from "@/lib/format";
import { RetryButton } from "@/components/sessions/RetryButton";

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

  const [sessions, total, userPrefs] = await Promise.all([
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
    db.user.findUnique({ where: { id: session.user.id }, select: { speedUnit: true } }),
  ]);

  const unit = (userPrefs?.speedUnit ?? "KNOTS") as SpeedUnit;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Log</p>
          <h1 className="text-sm uppercase tracking-wide font-medium">All Sessions</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Source filter */}
          <div className="flex items-center gap-1">
            {[
              { label: "All", value: undefined },
              { label: "Uploads", value: "UPLOAD" },
              { label: "Strava", value: "STRAVA" },
            ].map((f) => (
              <Link
                key={f.label}
                href={f.value ? `/sessions?source=${f.value}` : "/sessions"}
                className={`px-2.5 py-1 text-[9px] tracking-widest uppercase border transition-colors ${
                  source === f.value
                    ? "border-foreground/40 text-foreground bg-muted"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Link
            href="/upload"
            className="border border-border px-3 py-1.5 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
          >
            + Upload GPX
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-6">
        {sessions.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <p className="text-xs text-muted-foreground tracking-wide uppercase">No sessions yet.</p>
            <Link href="/upload" className="text-xs uppercase tracking-wide hover:underline mt-2 inline-block">
              Upload your first GPX →
            </Link>
          </div>
        ) : (
          <>
            <div className="border border-border">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_6rem] border-b border-border bg-muted/40">
                {["Session", "Date", "Waves", "Top Speed", "Duration", "Source"].map((h) => (
                  <div key={h} className="px-4 py-2 text-[9px] tracking-widest uppercase text-muted-foreground">{h}</div>
                ))}
              </div>
              {sessions.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_6rem] hover:bg-muted/40 transition-colors ${i < sessions.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="px-4 py-3 text-xs uppercase tracking-wide truncate">
                    {s.title ?? "Surf Session"}
                  </div>
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.startTime).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
                  </div>
                  <div className="px-4 py-3 text-xs flex items-center gap-2">
                    {s.processingState === "COMPLETE" ? s.waveCount : (
                      <>
                        <span className={`text-[10px] tracking-widest uppercase ${s.processingState === "FAILED" ? "text-destructive" : "text-muted-foreground"}`}>
                          {s.processingState === "FAILED" ? "Failed" : "Processing"}
                        </span>
                        <RetryButton sessionId={s.id} />
                      </>
                    )}
                  </div>
                  <div className="px-4 py-3 text-xs">
                    {s.processingState === "COMPLETE" ? formatSpeed(s.maxSpeedMs, unit) : "—"}
                  </div>
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    {s.processingState === "COMPLETE" ? formatDuration(s.durationSeconds) : "—"}
                  </div>
                  <div className="px-4 py-3">
                    <span className="text-[9px] tracking-widest uppercase text-muted-foreground/60 border border-border/50 px-1.5 py-0.5">
                      {s.source === "STRAVA" ? "Strava" : "GPX"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  Page {page} of {totalPages} — {total} sessions
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/sessions?page=${page - 1}${source ? `&source=${source}` : ""}`}
                      className="border border-border px-3 py-1.5 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
                    >
                      ← Prev
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/sessions?page=${page + 1}${source ? `&source=${source}` : ""}`}
                      className="border border-border px-3 py-1.5 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
