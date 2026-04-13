import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QuiverClient } from "./QuiverClient";

export default async function QuiverPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const boards = await db.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <QuiverClient initialBoards={boards} />;
}
