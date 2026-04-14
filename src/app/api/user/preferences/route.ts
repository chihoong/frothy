import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { SpeedUnit } from "@/lib/format";

const VALID_SPEED_UNITS: SpeedUnit[] = ["KNOTS", "KMH", "MPH"];

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { speedUnit: true },
  });

  return NextResponse.json({ speedUnit: user?.speedUnit ?? "KNOTS" });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { speedUnit } = body;

  if (!VALID_SPEED_UNITS.includes(speedUnit)) {
    return NextResponse.json({ error: "Invalid speed unit" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { speedUnit },
    select: { speedUnit: true },
  });

  return NextResponse.json(user);
}
