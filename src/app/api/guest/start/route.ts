import { NextResponse } from "next/server";
import { createGuestCookie } from "@/lib/auth";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestRepo } from "@/lib/data";
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

  const guest = await repo.createGuestSession({
    propertyId: property.id,
    guestName: "Alex",
    checkInDate: todayISO(0),
    checkOutDate: todayISO(4),
    preferences: { interests: [], notes: "", consent: false },
  });

  await createGuestCookie(guest.id);
  return NextResponse.redirect(new URL("/welcome", request.url));
}
