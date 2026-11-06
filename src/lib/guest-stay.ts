import type { Repository } from "./data/repo";
import type { GuestSession, Reservation } from "./types";

/** Open or reuse the stay session for a confirmed reservation. */
export async function ensureGuestStay(
  repo: Repository,
  reservation: Reservation,
): Promise<GuestSession> {
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

  return guest;
}
