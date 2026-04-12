import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground" style={{ fontFamily: "var(--font-mono), monospace" }}>
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest uppercase text-muted-foreground">FROTHY</span>
          <span className="text-border">|</span>
          <span className="text-xs tracking-widest uppercase text-muted-foreground">SURF SESSION ANALYZER</span>
        </div>
        <Link
          href="/login"
          className="border border-border px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-muted transition-colors"
        >
          Sign In →
        </Link>
      </header>

      {/* Hero */}
      <div className="flex flex-1 flex-col justify-between p-8 md:p-16">
        <div className="grid grid-cols-2 gap-2 text-xs tracking-widest uppercase text-muted-foreground mb-16">
          <span>GPS PRECISION</span>
          <span className="text-right">WAVE DETECTION</span>
        </div>

        <div className="max-w-3xl">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
            — FIELD ANALYTICS PLATFORM
          </p>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-tight mb-8 uppercase">
            ANALYZE YOUR<br />SURF SESSIONS<br />WITH PRECISION.
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-10 tracking-wide">
            Upload GPX files or sync from Strava to see your wave count,
            top speed, distance paddled, and an interactive map of every session.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="bg-foreground text-background px-6 py-2.5 text-xs tracking-widest uppercase font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border border-border px-6 py-2.5 text-xs tracking-widest uppercase hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-3 gap-px border border-border">
          {[
            { code: "01", label: "Wave Detection", desc: "Auto-detect waves from GPS track using velocity analysis" },
            { code: "02", label: "Speed Metrics", desc: "Max and average speed per wave in knots or km/h" },
            { code: "03", label: "Strava Sync", desc: "Auto-import all surf sessions via Strava webhook" },
          ].map((f) => (
            <div key={f.code} className="border-border p-6 bg-card">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{f.code}</p>
              <p className="text-sm font-medium uppercase tracking-wide mb-2">{f.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-border px-6 py-3 flex justify-between items-center">
        <span className="text-xs text-muted-foreground tracking-widest uppercase">v0.1.0</span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Frothy © 2026</span>
      </footer>
    </main>
  );
}
