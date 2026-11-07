import { NextResponse } from "next/server";
import { requestAffiliation } from "@/lib/affiliations";
import { getGuestAccount } from "@/lib/guest-account";
import { rateLimit } from "@/lib/rate-limit";
import { affiliationRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const account = await getGuestAccount();
  if (!account) {
    return NextResponse.json(
      { error: "Sign in to a guest account to connect with a host." },
      { status: 401 },
    );
  }

  const limit = rateLimit(`affiliation:${account.id}`, 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = affiliationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Choose a host and offering." },
      { status: 400 },
    );
  }

  const result = await requestAffiliation({
    guest: account,
    hostId: parsed.data.hostId,
    propertyId: parsed.data.propertyId,
    reservationId: parsed.data.reservationId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, affiliation: result.affiliation }, { status: 201 });
}
