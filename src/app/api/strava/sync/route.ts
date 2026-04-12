import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listActivities } from "@/lib/strava/client";
import { stravaQueue } from "@/lib/queue";
import { headers } from "next/headers";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await db.stravaToken.findUnique({
    where: { userId: session.user.id },
  });
  if (!token) {
    return NextResponse.json({ error: "Strava not connected" }, { status: 400 });
  }

  // Fetch last 200 activities (4 pages of 50)
  let queued = 0;
  for (let page = 1; page <= 4; page++) {
    const activities = await listActivities(session.user.id, undefined, page);
    if (activities.length === 0) break;

    for (const activity of activities) {
      if (activity.sport_type !== "Surfing") continue;
      await stravaQueue.add(
        "strava-sync",
        {
          stravaActivityId: activity.id,
          stravaAthleteId: token.athleteId,
        },
        { jobId: `strava-${activity.id}`, attempts: 3 }
      );
      queued++;
    }
  }

  return NextResponse.json({ queued });
}
