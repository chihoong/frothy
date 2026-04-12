import { NextRequest, NextResponse } from "next/server";
import { stravaQueue } from "@/lib/queue";
import { createHmac } from "crypto";

// Strava verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava event push
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate HMAC signature
  const signature = req.headers.get("x-hub-signature") ?? "";
  const expected =
    "sha256=" +
    createHmac("sha256", process.env.STRAVA_CLIENT_SECRET!)
      .update(rawBody)
      .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.object_type === "activity" && event.aspect_type === "create") {
    await stravaQueue.add(
      "strava-sync",
      {
        stravaActivityId: event.object_id,
        stravaAthleteId: event.owner_id,
      },
      { attempts: 3, backoff: { type: "exponential", delay: 10000 } }
    );
  }

  return NextResponse.json({ ok: true });
}
