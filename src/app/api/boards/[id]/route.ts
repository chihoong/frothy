import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { BoardType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.board.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, shaper, boardType, lengthStr, widthStr, thicknessStr, volumeL, purchasedAt, notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const board = await db.board.update({
    where: { id },
    data: {
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

  return NextResponse.json(board);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.board.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.board.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
