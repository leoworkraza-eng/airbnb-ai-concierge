import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { DEMO_GUEST } from "@/lib/demo-data";
import { todayISO } from "@/lib/utils";

/* Creates the guest stay for the demo property and remembers it in a signed
   cookie. Re-entering simply resumes the existing stay. */

export async function GET(request: Request) {
  const existing = await getGuestContext();
  if (existing) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const repo = await getGuestRepo();
  const property = await repo.getPrimaryProperty();

  if (!property) {
    // Nothing to visit yet: send the operator to the host sign-in that seeds it.
    return NextResponse.redirect(new URL("/host/login?setup=property", request.url));
  }

  // Starting the demo repeatedly must not grow the host's guest list. Reuse a
  // stay that is still in residence instead of inserting another demo guest.
  const sessions = await repo.listGuestSessions([property.id]);
  const today = todayISO(0);
  const active = sessions.find(
    (session) => session.checkInDate <= today && session.checkOutDate >= today,
  );
  const guest =
    active ??
    (await repo.createGuestSession({
      propertyId: property.id,
      guestName: DEMO_GUEST.name,
      checkInDate: todayISO(0),
      checkOutDate: todayISO(4),
      preferences: { interests: [], notes: "", consent: false },
    }));

  // Associate the stay with a reservation so the guest sees their booking.
  // Before the reservation migration has run this is a no-op, not a failure.
  try {
    await repo.linkReservationToGuest(property.id, guest);
  } catch (error) {
    if (!(error instanceof MigrationRequiredError)) {
      console.error("[guest/start] could not link a reservation", error);
    }
  }

  await createGuestCookie(guest.id);
  return NextResponse.redirect(new URL("/welcome", request.url));
}
