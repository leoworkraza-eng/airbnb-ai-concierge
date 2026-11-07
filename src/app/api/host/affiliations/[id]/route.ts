import { NextResponse } from "next/server";
import { setAffiliationStatus } from "@/lib/affiliations";
import { getHostSession } from "@/lib/auth";
import { affiliationStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getHostSession();
  if (!session) {
    return NextResponse.json({ error: "Host sign-in required." }, { status: 401 });
  }

  const parsed = affiliationStatusSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
  }

  const { id } = await params;
  const affiliation = await setAffiliationStatus(id, session.hostId, parsed.data.status);
  if (!affiliation) {
    return NextResponse.json(
      { error: "That request is not one of your guests, or it no longer exists." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, affiliation });
}
