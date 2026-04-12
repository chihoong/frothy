import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [aggregate, recentSessions] = await Promise.all([
    db.surfSession.aggregate({
      where: { userId, processingState: "COMPLETE" },
      _count: { id: true },
      _sum: { waveCount: true, distanceMeters: true, durationSeconds: true },
      _max: { maxSpeedMs: true },
    }),
    db.surfSession.findMany({
      where: { userId, processingState: "COMPLETE" },
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        id: true, title: true, startTime: true, waveCount: true,
        maxSpeedMs: true, durationSeconds: true,
      },
    }),
  ]);

  return NextResponse.json({
    totalSessions: aggregate._count.id,
    totalWaves: aggregate._sum.waveCount ?? 0,
    totalDistanceMeters: aggregate._sum.distanceMeters ?? 0,
    totalDurationSeconds: aggregate._sum.durationSeconds ?? 0,
    bestSpeedMs: aggregate._max.maxSpeedMs ?? 0,
    recentSessions,
  });
}
