import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { signInGuestAccount } from "@/lib/guest-account";
import { ensureGuestStay } from "@/lib/guest-stay";
import { rateLimit } from "@/lib/rate-limit";
import { guestAccountLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`guest-account-login:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = guestAccountLoginSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details." },
      { status: 400 },
    );
  }

  try {
    const result = await signInGuestAccount(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 401 },
      );
    }

    if (result.booking) {
      const repo = await getGuestRepo();
      const property = await repo.getProperty(result.booking.propertyId);
      if (property) {
        const guest = await ensureGuestStay(repo, result.booking);
        await createGuestCookie(guest.id);
        return NextResponse.json({ ok: true, redirect: "/welcome" });
      }
    }

    return NextResponse.json({ ok: true, redirect: "/hosts" });
  } catch (error) {
    console.error("[guest/account] could not sign in", error);
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: "Guest accounts aren't set up on this deployment yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "We couldn't sign in to that account. Please try again." },
      { status: 500 },
    );
  }
}
