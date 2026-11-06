import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { signUpGuestAccount } from "@/lib/guest-account";
import { ensureGuestStay } from "@/lib/guest-stay";
import { rateLimit } from "@/lib/rate-limit";
import { guestAccountSignupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`guest-signup:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = guestAccountSignupSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details." },
      { status: 400 },
    );
  }

  try {
    const result = await signUpGuestAccount(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    const repo = await getGuestRepo();
    const property = await repo.getProperty(result.booking.propertyId);
    if (!property) {
      return NextResponse.json(
        { error: "That booking is no longer attached to a property." },
        { status: 404 },
      );
    }

    const guest = await ensureGuestStay(repo, result.booking);
    await createGuestCookie(guest.id);
    return NextResponse.json({ ok: true, redirect: "/welcome" }, { status: 201 });
  } catch (error) {
    console.error("[guest/signup] could not create the account", error);
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: "Guest accounts aren't set up on this deployment yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "We couldn't create that guest account. Please try again." },
      { status: 500 },
    );
  }
}
