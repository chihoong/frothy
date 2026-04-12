import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const source = searchParams.get("source") as "UPLOAD" | "STRAVA" | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where = {
    userId: session.user.id,
    ...(source && { source }),
    ...(startDate || endDate
      ? {
          startTime: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [sessions, total] = await Promise.all([
    db.surfSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        source: true,
        startTime: true,
        endTime: true,
        durationSeconds: true,
        distanceMeters: true,
        maxSpeedMs: true,
        avgSpeedMs: true,
        waveCount: true,
        processingState: true,
        centerLat: true,
        centerLng: true,
      },
    }),
    db.surfSession.count({ where }),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}
