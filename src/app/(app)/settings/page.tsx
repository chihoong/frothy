import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Configuration</p>
        <h1 className="text-sm uppercase tracking-wide font-medium">Settings</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-lg space-y-px border border-border">
          <Link
            href="/settings/strava"
            className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors group"
          >
            <div>
              <p className="text-xs tracking-wide uppercase font-medium mb-0.5">Strava Integration</p>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                Auto-sync surf sessions via webhook
              </p>
            </div>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
              Configure →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
