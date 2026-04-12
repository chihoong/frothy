import { db } from "@/lib/db";

const STRAVA_BASE = "https://www.strava.com/api/v3";

export type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
  average_speed: number;
  max_speed: number;
  map: { summary_polyline: string };
};

export type StravaStreams = {
  latlng?: { data: [number, number][] };
  time?: { data: number[] };
  velocity_smooth?: { data: number[] };
  altitude?: { data: number[] };
};

async function getValidToken(userId: string): Promise<string> {
  const token = await db.stravaToken.findUnique({ where: { userId } });
  if (!token) throw new Error("No Strava token for user");

  if (token.expiresAt < new Date()) {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });
    const data = await res.json();
    await db.stravaToken.update({
      where: { userId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * 1000),
      },
    });
    return data.access_token as string;
  }

  return token.accessToken;
}

export async function getActivity(userId: string, activityId: number): Promise<StravaActivity> {
  const token = await getValidToken(userId);
  const res = await fetch(`${STRAVA_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}

export async function getActivityStreams(
  userId: string,
  activityId: number
): Promise<StravaStreams> {
  const token = await getValidToken(userId);
  const res = await fetch(
    `${STRAVA_BASE}/activities/${activityId}/streams?keys=latlng,time,velocity_smooth,altitude&key_by_type=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Strava streams API error: ${res.status}`);
  return res.json();
}

export async function listActivities(
  userId: string,
  after?: number,
  page = 1
): Promise<StravaActivity[]> {
  const token = await getValidToken(userId);
  const params = new URLSearchParams({ per_page: "50", page: String(page) });
  if (after) params.set("after", String(after));
  const res = await fetch(`${STRAVA_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}
