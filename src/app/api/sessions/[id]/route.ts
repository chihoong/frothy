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
