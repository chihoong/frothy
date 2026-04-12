"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function StravaConnectButton({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    const res = await fetch("/api/strava/disconnect", { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("Strava disconnected");
      router.refresh();
    } else {
      toast.error("Failed to disconnect");
    }
  }

  async function handleSync() {
    setLoading(true);
    const res = await fetch("/api/strava/sync", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(`Syncing ${data.queued} surf session(s)…`);
    } else {
      toast.error("Sync failed");
    }
  }

  if (connected) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleSync}
          disabled={loading}
          className="border border-border px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors disabled:opacity-50"
        >
          Sync Now
        </button>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="border border-destructive/50 px-4 py-2 text-[10px] tracking-widest uppercase text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/strava/connect"
      className="inline-block border border-foreground/40 px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
    >
      Connect Strava →
    </a>
  );
}
