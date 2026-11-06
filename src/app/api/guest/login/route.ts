import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { chooseCurrentStay, surnameMatches } from "@/lib/guest-profile";
import { rateLimit } from "@/lib/rate-limit";
import { guestLoginSchema } from "@/lib/validation";

/* Guests sign in with the identity already attached to their booking: the
   email identifies the profile, the surname confirms it. No password, no
   one-off reservation code. */

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
      { error: parsed.error.issues[0]?.message ?? "Enter your booking details." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const repo = await getGuestRepo();
    const stays = await repo.listReservationsByEmail(email);
    const matches = stays.filter(
      (stay) =>
        stay.status !== "cancelled" &&
        surnameMatches(stay.guestName, parsed.data.lastName),
    );
    const reservation = chooseCurrentStay(matches);

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            "We couldn't match that email and surname to a booking. Check the details on your reservation and try again.",
        },
        { status: 404 },
      );
    }

    const property = await repo.getProperty(reservation.propertyId);
    if (!property) {
      return NextResponse.json(
        { error: "That booking is no longer attached to a property." },
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
    console.error("[guest/login] could not open the profile", error);
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: "Guest profiles aren't set up on this deployment yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "We couldn't open that profile. Please try again." },
      { status: 500 },
    );
  }
}
