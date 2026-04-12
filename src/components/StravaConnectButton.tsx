"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
        <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
          Sync now
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={loading}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button render={<a href="/api/strava/connect" />}>
      Connect Strava
    </Button>
  );
}
