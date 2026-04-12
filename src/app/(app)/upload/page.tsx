"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Status = "idle" | "uploading" | "processing" | "done" | "failed";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(gpx|tcx)$/i)) {
      toast.error("Only GPX files are supported");
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Upload failed");
      setStatus("failed");
      return;
    }

    const { sessionId } = await res.json();
    setStatus("processing");

    const poll = setInterval(async () => {
      const check = await fetch(`/api/upload/${sessionId}/status`);
      const { status: s } = await check.json();
      if (s === "COMPLETE") {
        clearInterval(poll);
        setStatus("done");
        toast.success("Session processed!");
        router.push(`/sessions/${sessionId}`);
      } else if (s === "FAILED") {
        clearInterval(poll);
        setStatus("failed");
        toast.error("Processing failed. Check the file and try again.");
      }
    }, 2000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const isIdle = status === "idle" || status === "failed";

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Ingest</p>
        <h1 className="text-sm uppercase tracking-wide font-medium">Upload GPX</h1>
      </div>

      <div className="flex-1 p-6 flex items-start">
        <div className="w-full max-w-lg">
          {/* Drop zone */}
          <div
            className={`relative border transition-colors cursor-pointer ${
              dragging
                ? "border-foreground/50 bg-muted/60"
                : isIdle
                ? "border-border hover:border-foreground/30 hover:bg-muted/20"
                : "border-border"
            } ${!isIdle ? "pointer-events-none" : ""}`}
            onDragOver={(e) => { e.preventDefault(); if (isIdle) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => isIdle && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".gpx,.tcx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              {status === "idle" && (
                <>
                  <div className="w-10 h-10 border border-border flex items-center justify-center mb-5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                      <path d="M8 1v10M4 5l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
                    Drop GPX file here
                  </p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
                    or click to browse — max 10 MB
                  </p>
                </>
              )}

              {status === "failed" && (
                <>
                  <div className="w-10 h-10 border border-destructive/50 flex items-center justify-center mb-5">
                    <span className="text-destructive text-sm">✕</span>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-destructive mb-1">Upload Failed</p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
                    Click to try again
                  </p>
                </>
              )}

              {status === "uploading" && (
                <>
                  <div className="w-10 h-10 border border-border flex items-center justify-center mb-5 animate-pulse">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                      <path d="M8 1v10M4 5l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Uploading</p>
                  {fileName && (
                    <p className="text-[10px] text-muted-foreground/40 truncate max-w-xs">{fileName}</p>
                  )}
                </>
              )}

              {status === "processing" && (
                <>
                  <div className="w-10 h-10 border border-border flex items-center justify-center mb-5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground animate-spin" style={{ animationDuration: "2s" }}>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/>
                    </svg>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Detecting Waves</p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
                    Analysing GPS track…
                  </p>
                </>
              )}

              {status === "done" && (
                <>
                  <div className="w-10 h-10 border border-border flex items-center justify-center mb-5">
                    <span className="text-foreground text-sm">✓</span>
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground">Complete — Redirecting</p>
                </>
              )}
            </div>
          </div>

          {/* Spec row */}
          <div className="mt-4 grid grid-cols-3 border border-border">
            {[
              { label: "Format", value: "GPX / TCX" },
              { label: "Max Size", value: "10 MB" },
              { label: "Source", value: "Any GPS Device" },
            ].map((item, i) => (
              <div key={item.label} className={`px-4 py-3 ${i < 2 ? "border-r border-border" : ""}`}>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 mb-0.5">{item.label}</p>
                <p className="text-[10px] tracking-widest uppercase">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
