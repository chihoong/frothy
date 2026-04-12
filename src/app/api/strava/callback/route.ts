import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/settings/strava?error=access_denied`
    );
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/settings/strava?error=token_exchange_failed`
    );
  }

  const data = await tokenRes.json();

  await db.stravaToken.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      athleteId: data.athlete.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
      scope: data.scope,
    },
    update: {
      athleteId: data.athlete.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
      scope: data.scope,
    },
  });

  // Register Strava webhook subscription (idempotent)
  await registerWebhook().catch(console.error);

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/settings/strava?connected=true`
  );
}

async function registerWebhook() {
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/strava/webhook`;
  const res = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      callback_url: callbackUrl,
      verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    }),
  });
  if (!res.ok && res.status !== 409) {
    // 409 = subscription already exists, which is fine
    console.error("Strava webhook registration failed", await res.text());
  }
}
