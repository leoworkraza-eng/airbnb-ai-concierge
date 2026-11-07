import { getGuestRepo } from "./data";
import type {
  Affiliation,
  AffiliationStatus,
  GuestAccount,
  GuestSession,
} from "./types";
import { todayISO } from "./utils";

/* Affiliation records are stored inside the existing guest_sessions.preferences
   JSON column. That keeps the feature live on the current database without a
   migration, while the UI and API still expose one clear affiliation model. */

export type AffiliationResult =
  | { ok: true; affiliation: Affiliation }
  | { ok: false; error: string; status: number };

function fromSession(session: GuestSession): Affiliation | null {
  const affiliation = session.preferences.affiliation;
  if (!affiliation) return null;
  return { ...affiliation, id: session.id };
}

export function isAffiliationSession(session: GuestSession) {
  return Boolean(session.preferences.affiliation);
}

export async function listAffiliationsForGuest(guestUserId: string) {
  if (!guestUserId) return [];
  const repo = await getGuestRepo();
  const sessions = await repo.listAllGuestSessions();
  return sessions
    .filter((session) => session.preferences.affiliation?.guestUserId === guestUserId)
    .map(fromSession)
    .filter((affiliation): affiliation is Affiliation => Boolean(affiliation));
}

export async function listAffiliationsForHost(hostId: string, propertyIds: string[]) {
  if (!hostId || !propertyIds.length) return [];
  const repo = await getGuestRepo();
  const sessions = await repo.listGuestSessions(propertyIds);
  return sessions.flatMap((session) => {
    const affiliation = fromSession(session);
    return affiliation && affiliation.hostId === hostId ? [affiliation] : [];
  });
}

export async function requestAffiliation(input: {
  guest: GuestAccount;
  hostId: string;
  propertyId: string;
  reservationId?: string | null;
}): Promise<AffiliationResult> {
  const repo = await getGuestRepo();
  const property = await repo.getProperty(input.propertyId);
  if (!property || property.hostId !== input.hostId) {
    return { ok: false, error: "That host offering could not be found.", status: 404 };
  }

  const host = await repo.getProfile(input.hostId);
  if (!host) {
    return { ok: false, error: "That host profile could not be found.", status: 404 };
  }

  let reservation = null;
  if (input.reservationId) {
    reservation = await repo.getReservation(input.reservationId);
    if (!reservation || reservation.propertyId !== property.id) {
      return { ok: false, error: "That reservation does not belong to this host.", status: 404 };
    }
    if (reservation.guestEmail.trim().toLowerCase() !== input.guest.email.trim().toLowerCase()) {
      return {
        ok: false,
        error: "That reservation was made with a different email address.",
        status: 403,
      };
    }
  }

  const sessions = await repo.listAllGuestSessions();
  const existing = sessions.find(
    (session) =>
      session.preferences.affiliation?.guestUserId === input.guest.id &&
      session.preferences.affiliation?.hostId === input.hostId,
  );

  const now = new Date().toISOString();

  if (existing?.preferences.affiliation) {
    const current = existing.preferences.affiliation;
    if (current.status === "pending" || current.status === "accepted") {
      return { ok: true, affiliation: { ...current, id: existing.id } };
    }

    const renewed: Affiliation = {
      ...current,
      status: "pending",
      initiatedBy: "guest",
      reservationId: input.reservationId ?? current.reservationId,
      updatedAt: now,
    };
    await repo.updateGuestPreferences(existing.id, {
      ...existing.preferences,
      affiliation: renewed,
    });
    return { ok: true, affiliation: renewed };
  }

  let session = reservation?.guestSessionId
    ? await repo.getGuestSession(reservation.guestSessionId)
    : null;

  if (!session) {
    session = await repo.createGuestSession({
      propertyId: property.id,
      guestName: input.guest.fullName,
      checkInDate: reservation?.checkInDate ?? todayISO(0),
      checkOutDate: reservation?.checkOutDate ?? todayISO(1),
      preferences: { interests: [], notes: "", consent: false },
    });
    if (reservation) {
      await repo.attachReservationToGuest(reservation.id, session.id);
    }
  }

  const affiliation: Affiliation = {
    id: session.id,
    guestUserId: input.guest.id,
    guestName: input.guest.fullName,
    guestEmail: input.guest.email,
    hostId: host.id,
    hostName: host.fullName,
    propertyId: property.id,
    propertyName: property.name,
    status: "pending",
    initiatedBy: "guest",
    reservationId: reservation?.id ?? input.reservationId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await repo.updateGuestPreferences(session.id, {
    ...session.preferences,
    affiliation,
  });

  await repo
    .createNotification({
      hostId: host.id,
      propertyId: property.id,
      message: `${input.guest.fullName} asked to connect with ${host.fullName}.`,
      type: "system",
    })
    .catch(() => undefined);

  return { ok: true, affiliation };
}

export async function setAffiliationStatus(
  id: string,
  hostId: string,
  status: Exclude<AffiliationStatus, "pending">,
): Promise<Affiliation | null> {
  const repo = await getGuestRepo();
  const session = await repo.getGuestSession(id);
  const affiliation = session?.preferences.affiliation;

  if (!session || !affiliation || affiliation.hostId !== hostId) return null;

  const property = await repo.getProperty(session.propertyId);
  if (!property || property.hostId !== hostId) return null;

  const updated: Affiliation = {
    ...affiliation,
    status,
    updatedAt: new Date().toISOString(),
  };
  await repo.updateGuestPreferences(id, {
    ...session.preferences,
    affiliation: updated,
  });

  return updated;
}
