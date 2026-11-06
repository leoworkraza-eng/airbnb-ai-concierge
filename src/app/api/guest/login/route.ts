import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { rateLimit } from "@/lib/rate-limit";
import { guestLoginSchema } from "@/lib/validation";

/* Guests sign in with the reservation code the host gave them. The code only
   resolves a stay; it never grants access to the host workspace. */

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`guest-login:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429 },
    );
  }

  const parsed = guestLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter your reservation code." },
      { status: 400 },
    );
  }

  // Accept "cb k4ycu" as well as the canonical "CB-K4YCU".
  const compact = parsed.data.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const code =
    compact.length === 7 ? `${compact.slice(0, 2)}-${compact.slice(2)}` : compact;

  try {
    const repo = await getGuestRepo();
    const reservation = await repo.getReservationByCode(code);

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            "That reservation code doesn't match a stay. Check the code in your arrival message and try again.",
        },
        { status: 404 },
      );
    }

    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "That stay has been cancelled. Contact your host if this looks wrong." },
        { status: 410 },
      );
    }

    const property = await repo.getProperty(reservation.propertyId);
    if (!property) {
      return NextResponse.json(
        { error: "That reservation is no longer attached to a property." },
        { status: 404 },
      );
    }

    let guest = reservation.guestSessionId
      ? await repo.getGuestSession(reservation.guestSessionId)
      : null;

    if (!guest) {
      guest = await repo.createGuestSession({
        propertyId: reservation.propertyId,
        guestName: reservation.guestName,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        preferences: { interests: [], notes: "", consent: false },
      });
      await repo.attachReservationToGuest(reservation.id, guest.id);
    }

    await createGuestCookie(guest.id);
    return NextResponse.json({ ok: true, redirect: "/welcome" });
  } catch (error) {
    console.error("[guest/login] could not open the stay", error);
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: "Guest sign-in isn't set up on this deployment yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "We couldn't open that stay. Please try again." },
      { status: 500 },
    );
  }
}
