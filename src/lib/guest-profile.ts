import type { Reservation } from "./types";

/* Guest identity lives on the booking: the email identifies the profile, the
   surname confirms it. No separate password or one-off access code. */

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function surnameMatches(fullName: string, entered: string) {
  const name = normalizeName(fullName);
  const surname = normalizeName(entered);
  if (!name || !surname) return false;
  if (name === surname) return true;
  if (name.endsWith(` ${surname}`)) return true;
  return name.split(" ").at(-1) === surname;
}

const statusOrder: Record<Reservation["status"], number> = {
  in_house: 0,
  upcoming: 1,
  completed: 2,
  cancelled: 3,
};

/** Pick the stay a guest should land on when their email has more than one. */
export function chooseCurrentStay(stays: Reservation[]) {
  return [...stays]
    .filter((stay) => stay.status !== "cancelled")
    .sort((a, b) => {
      const status = statusOrder[a.status] - statusOrder[b.status];
      if (status !== 0) return status;
      return a.status === "completed"
        ? b.checkOutDate.localeCompare(a.checkOutDate)
        : a.checkInDate.localeCompare(b.checkInDate);
    })[0] ?? null;
}

export function sortStaysNewest(stays: Reservation[]) {
  return [...stays].sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
}

export function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}
