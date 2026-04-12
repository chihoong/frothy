"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Status = "idle" | "uploading" | "processing" | "done" | "failed";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(gpx|tcx)$/i)) {
      toast.error("Only GPX files are supported");
      return;
    }

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

    // Poll for completion
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

  return (
    <div className="p-6 max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Upload GPX</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload a surf session</CardTitle>
          <CardDescription>
            GPX files from any GPS watch or action camera. Max 10 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              dragging
                ? "border-primary bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
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
            {status === "idle" || status === "failed" ? (
              <>
                <div className="mb-2 text-3xl">📤</div>
                <p className="text-sm text-gray-600">
                  Drop a GPX file here or <span className="text-primary">browse</span>
                </p>
              </>
            ) : status === "uploading" ? (
              <p className="text-sm text-gray-600">Uploading…</p>
            ) : status === "processing" ? (
              <div className="text-center">
                <div className="mb-2 text-3xl animate-spin">⚙️</div>
                <p className="text-sm text-gray-600">Detecting waves…</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-2 text-3xl">✅</div>
                <p className="text-sm text-gray-600">Done! Redirecting…</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
