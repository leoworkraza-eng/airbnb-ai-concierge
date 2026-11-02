import type { GuestSession, Property } from "./types";
import { getGuestRepo } from "./data";
import { getGuestSessionId } from "./auth";

/* Guest-side request context helpers shared by pages and route handlers. */

export type GuestContext = {
  guest: GuestSession;
  property: Property;
};

export async function getGuestContext(): Promise<GuestContext | null> {
  const sessionId = await getGuestSessionId();
  if (!sessionId) return null;

  const repo = await getGuestRepo();
  const guest = await repo.getGuestSession(sessionId);
  if (!guest) return null;

  const property = await repo.getProperty(guest.propertyId);
  if (!property) return null;

  return { guest, property };
}

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
