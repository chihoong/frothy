import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { deleteFile } from "@/lib/s3";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      waves: { orderBy: { waveNumber: "asc" } },
      // Downsample trackpoints: return every 5th point for map rendering
      trackpoints: {
        orderBy: { recordedAt: "asc" },
        select: { lat: true, lng: true, speedMs: true, recordedAt: true },
      },
    },
  });

  if (!surfSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Downsample trackpoints to every 5th for the map overlay
  const downsampledTrackpoints = surfSession.trackpoints.filter(
    (_, i) => i % 5 === 0
  );

  return NextResponse.json({
    ...surfSession,
    trackpoints: downsampledTrackpoints,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, startTime: true, endTime: true },
  });
  if (!surfSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    update.title = body.title.trim() || null;
  }

  if (typeof body.startTime === "string") {
    const newStart = new Date(body.startTime);
    if (isNaN(newStart.getTime())) {
      return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
    }
    const delta = newStart.getTime() - surfSession.startTime.getTime();
    update.startTime = newStart;
    update.endTime = new Date(surfSession.endTime.getTime() + delta);
  }

  const updated = await db.surfSession.update({
    where: { id },
    data: update,
    select: { id: true, title: true, startTime: true, endTime: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!surfSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (surfSession.rawFileKey) {
    await deleteFile(surfSession.rawFileKey).catch(() => {});
  }

  await db.surfSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
