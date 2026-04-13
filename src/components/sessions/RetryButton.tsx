"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RetryButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await fetch(`/api/sessions/${sessionId}/retry`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast.success("Requeued for processing");
      router.refresh();
    } else {
      toast.error("Retry failed");
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="text-[9px] tracking-widest uppercase border border-border/50 px-2 py-0.5 hover:bg-muted transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Retry"}
    </button>
  );
}
