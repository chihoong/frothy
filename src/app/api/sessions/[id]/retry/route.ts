import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { uploadQueue } from "@/lib/queue";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const surfSession = await db.surfSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, rawFileKey: true, processingState: true },
  });

  if (!surfSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!surfSession.rawFileKey) return NextResponse.json({ error: "No file to reprocess" }, { status: 400 });

  await db.surfSession.update({
    where: { id },
    data: { processingState: "PENDING", processingError: null },
  });

  await uploadQueue.add("process-upload", {
    sessionId: id,
    userId: session.user.id,
    rawFileKey: surfSession.rawFileKey,
  });

  return NextResponse.json({ ok: true });
}
