import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// Full-resolution trackpoints for the speed chart
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!surfSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const trackpoints = await db.trackpoint.findMany({
    where: { sessionId: id },
    orderBy: { recordedAt: "asc" },
    select: { recordedAt: true, lat: true, lng: true, speedMs: true, altitudeM: true },
  });

  return NextResponse.json({ trackpoints });
}
