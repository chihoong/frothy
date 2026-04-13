import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { BoardType } from "@prisma/client";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await db.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, shaper, boardType, lengthStr, widthStr, thicknessStr, volumeL, purchasedAt, notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const board = await db.board.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      shaper: shaper?.trim() || null,
      boardType: (boardType as BoardType) || "SHORTBOARD",
      lengthStr: lengthStr?.trim() || null,
      widthStr: widthStr?.trim() || null,
      thicknessStr: thicknessStr?.trim() || null,
      volumeL: volumeL ? parseFloat(volumeL) : null,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(board, { status: 201 });
}
