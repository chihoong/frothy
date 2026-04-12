import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/s3";
import { uploadQueue } from "@/lib/queue";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.match(/\.(gpx|tcx)$/i)) {
    return NextResponse.json(
      { error: "Only GPX files are supported" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileKey = `uploads/${session.user.id}/${randomUUID()}.gpx`;

  await uploadFile(fileKey, bytes, "application/gpx+xml");

  // Create a placeholder session record
  const surfSession = await db.surfSession.create({
    data: {
      userId: session.user.id,
      source: "UPLOAD",
      title: file.name.replace(/\.(gpx|tcx)$/i, ""),
      startTime: new Date(),
      endTime: new Date(),
      durationSeconds: 0,
      distanceMeters: 0,
      maxSpeedMs: 0,
      avgSpeedMs: 0,
      rawFileKey: fileKey,
      processingState: "PENDING",
    },
  });

  await uploadQueue.add(
    "process-upload",
    { sessionId: surfSession.id, userId: session.user.id, rawFileKey: fileKey },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return NextResponse.json({ sessionId: surfSession.id, status: "PENDING" });
  } catch (err) {
    const e = err as Error;
    console.error("[upload] error:", e.stack ?? e);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
