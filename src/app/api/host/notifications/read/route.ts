import { NextResponse } from "next/server";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";

export async function POST(request: Request) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.redirect(new URL("/host/login", request.url), { status: 303 });
  }

  const repo = await getHostRepo();
  await repo.markNotificationsRead(session.hostId);

  return NextResponse.redirect(new URL("/host", request.url), { status: 303 });
}
