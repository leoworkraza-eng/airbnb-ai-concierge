import type { ReservationSource, ReservationStatus } from "./types";

/* Reservation vocabulary shared by the host dashboard, the guest stay page and
   the API routes, so a status is spelled the same everywhere. */

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  upcoming: "Upcoming",
  in_house: "In house",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const reservationStatusStyles: Record<ReservationStatus, string> = {
  upcoming: "bg-brand-soft text-brand-dark ring-brand/20",
  in_house: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-sand text-ink-soft ring-line",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export const reservationSourceLabels: Record<ReservationSource, string> = {
  airbnb: "Airbnb sync",
  manual: "Added by host",
  demo: "Demo data",
};

export const reservationSourceNotes: Record<ReservationSource, string> = {
  airbnb: "Written by an authorised Airbnb integration.",
  manual: "Entered by the host in this dashboard.",
  demo: "Sample reservation created for this prototype — not a real booking.",
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A readable booking reference. `AB` is only used for integration rows. */
export function newReservationCode(source: ReservationSource = "manual") {
  const prefix = source === "airbnb" ? "AB" : "CB";
  let body = "";
  for (let index = 0; index < 5; index += 1) {
    body += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${prefix}-${body}`;
}

/** Status a stay should have on a given day, used to keep the list honest. */
export function statusForDates(
  checkInDate: string,
  checkOutDate: string,
  today: string,
): ReservationStatus {
  if (today < checkInDate) return "upcoming";
  if (today > checkOutDate) return "completed";
  return "in_house";
}
