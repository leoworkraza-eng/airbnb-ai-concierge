import { cache } from "react";
import type { GuestAccount, GuestSession, Property } from "./types";
import { getGuestRepo } from "./data";
import { getGuestSessionId } from "./auth";
import { getGuestAccount } from "./guest-account";
import { todayISO } from "./utils";

/* Guest-side request context helpers shared by pages and route handlers.

   A guest account does not need a booking: when no stay is linked, the guest
   gets a planning workspace on the demo Barcelona base so the welcome page,
   city guide, plan, concierge and support are all available. Booking-linked
   sessions always win over the planning fallback. */

export type GuestContext = {
  guest: GuestSession;
  property: Property;
  account: GuestAccount | null;
  isPlanning: boolean;
};

async function resolveContext(): Promise<GuestContext | null> {
  const repo = await getGuestRepo();
  const sessionId = await getGuestSessionId();

  if (sessionId) {
    const guest = await repo.getGuestSession(sessionId);
    if (guest) {
      const property = await repo.getProperty(guest.propertyId);
      if (property) {
        return {
          guest,
          property,
          account: await getGuestAccount(),
          isPlanning: false,
        };
      }
    }
  }

  const account = await getGuestAccount();
  if (!account) return null;

  const sessions = await repo.listAllGuestSessions();
  const owned = sessions
    .filter(
      (session) =>
        session.preferences.affiliation?.guestUserId === account.id ||
        session.preferences.planningGuestUserId === account.id,
    )
    .sort((a, b) => {
      const rank = (session: GuestSession) => {
        const status = session.preferences.affiliation?.status;
        if (status === "accepted") return 0;
        if (status) return 1;
        return 2;
      };
      return rank(a) - rank(b);
    });

  for (const session of owned) {
    const property = await repo.getProperty(session.propertyId);
    if (property) {
      return { guest: session, property, account, isPlanning: true };
    }
  }

  const property = await repo.getPrimaryProperty();
  if (!property) return null;

  const guest = await repo.createGuestSession({
    propertyId: property.id,
    guestName: account.fullName,
    checkInDate: todayISO(0),
    checkOutDate: todayISO(3),
    preferences: {
      interests: [],
      notes: "",
      consent: false,
      planningGuestUserId: account.id,
    },
  });

  return { guest, property, account, isPlanning: true };
}

export const getGuestContext = cache(async (): Promise<GuestContext | null> => {
  try {
    return await resolveContext();
  } catch (error) {
    console.error("[guest] Could not resolve the guest workspace", error);
    return null;
  }
});

export function greeting(name: string) {
  const hour = Number(
    new Date().toLocaleString("en-GB", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hour12: false,
    }),
  );
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}
