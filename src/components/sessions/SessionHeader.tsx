"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  sessionId: string;
  title: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
  source: "UPLOAD" | "STRAVA";
  centerLat?: number | null;
  centerLng?: number | null;
};

export function SessionHeader({
  sessionId,
  title,
  startTime,
  endTime,
  source,
  centerLat,
  centerLng,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title ?? "");
  const [draftDate, setDraftDate] = useState(toDateLocal(startTime));
  const [draftTime, setDraftTime] = useState(toTimeLocal(startTime));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  function openEdit() {
    setDraftTitle(title ?? "");
    setDraftDate(toDateLocal(startTime));
    setDraftTime(toTimeLocal(startTime));
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const newStart = new Date(`${draftDate}T${draftTime}`);
      if (isNaN(newStart.getTime())) {
        setError("Invalid date or time");
        return;
      }
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          startTime: newStart.toISOString(),
        }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  const displayDate = new Date(startTime)
    .toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
  const displayTime = new Date(startTime)
    .toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: breadcrumb + title */}
      <div className="min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={titleRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Session title"
                className="text-sm uppercase tracking-wide font-medium bg-transparent border-b border-foreground/40 outline-none focus:border-foreground w-64 py-0.5"
              />
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                onKeyDown={onKeyDown}
                className="text-[10px] tracking-widest uppercase bg-transparent border border-border px-2 py-1 outline-none focus:border-foreground/60"
              />
              <input
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
                onKeyDown={onKeyDown}
                className="text-[10px] tracking-widest uppercase bg-transparent border border-border px-2 py-1 outline-none focus:border-foreground/60"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={isPending}
                className="text-[9px] tracking-widest uppercase border border-foreground bg-foreground text-background px-3 py-1 hover:bg-foreground/90 transition-colors disabled:opacity-40"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancel}
                disabled={isPending}
                className="text-[9px] tracking-widest uppercase border border-border px-3 py-1 hover:border-foreground/40 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              {error && (
                <p className="text-[9px] tracking-widest uppercase text-destructive">{error}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              <Link href="/sessions" className="hover:text-foreground transition-colors">
                Sessions
              </Link>
              {" / "}
              {displayDate}
            </p>
            <div className="flex items-center gap-2 group">
              <h1 className="text-sm uppercase tracking-wide font-medium">
                {title ?? "Surf Session"}
              </h1>
              <button
                onClick={openEdit}
                className="text-[9px] tracking-widest uppercase text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Edit session"
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: coords, time, source */}
      {!editing && (
        <div className="flex items-center gap-4 shrink-0">
          {centerLat != null && centerLng != null && (
            <p className="text-[10px] tracking-widest text-muted-foreground/60 uppercase hidden md:block">
              {centerLat.toFixed(4)}° / {centerLng.toFixed(4)}°
            </p>
          )}
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
            {displayTime}
          </p>
          <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${
            source === "STRAVA"
              ? "border-muted-foreground/40 text-muted-foreground"
              : "border-border text-muted-foreground"
          }`}>
            {source === "STRAVA" ? "Strava" : "Upload"}
          </span>
        </div>
      )}
    </div>
  );
}

function toDateLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeLocal(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}
