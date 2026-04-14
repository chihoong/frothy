import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatSpeed, speedUnitLabel, type SpeedUnit } from "@/lib/format";
import { RetryButton } from "@/components/sessions/RetryButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [aggregate, recent, userPrefs] = await Promise.all([
    db.surfSession.aggregate({
      where: { userId, processingState: "COMPLETE" },
      _count: { id: true },
      _sum: { waveCount: true, durationSeconds: true },
      _max: { maxSpeedMs: true },
    }),
    db.surfSession.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: 8,
      select: {
        id: true, title: true, startTime: true, waveCount: true,
        maxSpeedMs: true, durationSeconds: true, processingState: true,
      },
    }),
    db.user.findUnique({ where: { id: userId }, select: { speedUnit: true } }),
  ]);

  const unit = (userPrefs?.speedUnit ?? "KNOTS") as SpeedUnit;

  const stats = [
    { label: "Sessions", value: String(aggregate._count.id), unit: "TOTAL" },
    { label: "Total Waves", value: String(aggregate._sum.waveCount ?? 0), unit: "COUNT" },
    {
      label: "Best Speed",
      value: aggregate._max.maxSpeedMs ? formatSpeed(aggregate._max.maxSpeedMs, unit).split(" ")[0] : "—",
      unit: `${speedUnitLabel(unit).toUpperCase()} MAX`,
    },
    {
      label: "Time in Water",
      value: formatDuration(aggregate._sum.durationSeconds ?? 0),
      unit: "H:MM:SS",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Overview</p>
          <h1 className="text-sm uppercase tracking-wide font-medium">Dashboard</h1>
        </div>
        <Link
          href="/upload"
          className="border border-border px-3 py-1.5 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
        >
          + Upload GPX
        </Link>
      </div>

      {/* Stats row — matches older design layout */}
      <div className="grid grid-cols-4 border-b border-border">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-6 py-5 ${i < 3 ? "border-r border-border" : ""}`}>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{s.label}</p>
            <p className="text-3xl font-light tracking-tight">{s.value}</p>
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 mt-1">{s.unit}</p>
          </div>
        ))}
      </div>

      {/* Recent sessions table */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Recent Sessions</p>
          <Link href="/sessions" className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            View All →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <p className="text-xs text-muted-foreground tracking-wide uppercase">No sessions yet.</p>
            <Link href="/upload" className="text-xs uppercase tracking-wide hover:underline mt-2 inline-block">
              Upload your first GPX →
            </Link>
          </div>
        ) : (
          <div className="border border-border">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-border bg-muted/40">
              {["Session", "Date", "Waves", "Top Speed", "Duration"].map((h) => (
                <div key={h} className="px-4 py-2 text-[9px] tracking-widest uppercase text-muted-foreground">{h}</div>
              ))}
            </div>
            {recent.map((s, i) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] hover:bg-muted/40 transition-colors ${i < recent.length - 1 ? "border-b border-border" : ""}`}
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
