import { barcelonaPlaces } from "./demo-data";
import type { ItineraryItem, ItinerarySlot, Place } from "./types";

/* ---------------------------------------------------------------------------
   Itinerary vocabulary and the deterministic plan builder.

   The plan is a real, persisted list of stops — not a rendered suggestion. It
   is built from the same curated Barcelona guide the concierge answers from, so
   a plan without a model key is still grounded in actual data, and it is
   labelled as curated demonstration content wherever prices or hours are
   implied.
   --------------------------------------------------------------------------- */

export const itinerarySlotOrder: ItinerarySlot[] = ["morning", "afternoon", "evening"];

export const itinerarySlotLabels: Record<ItinerarySlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const itinerarySlotHints: Record<ItinerarySlot, string> = {
  morning: "Coffee, a market, a first walk",
  afternoon: "Museums, shopping, the waterfront",
  evening: "Dinner, drinks, music",
};

const slotCategories: Record<ItinerarySlot, Place["category"][]> = {
  morning: ["cafe", "market", "outdoors"],
  afternoon: ["culture", "shopping", "outdoors", "market"],
  evening: ["restaurant", "nightlife"],
};

export function isItinerarySlot(value: unknown): value is ItinerarySlot {
  return value === "morning" || value === "afternoon" || value === "evening";
}

export function slotRank(slot: ItinerarySlot) {
  return itinerarySlotOrder.indexOf(slot);
}

/** Printable date for a day of the stay (day 1 = check-in day). */
export function itineraryDate(checkInDate: string, day: number) {
  const date = new Date(`${checkInDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return checkInDate;
  date.setUTCDate(date.getUTCDate() + Math.max(day - 1, 0));
  return date.toISOString().slice(0, 10);
}

/** Nights a guest can plan for, clamped so a bad date can't produce 400 days. */
export function stayDayCount(checkInDate: string, checkOutDate: string) {
  const start = new Date(`${checkInDate}T00:00:00Z`).getTime();
  const end = new Date(`${checkOutDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  const days = Math.round((end - start) / 86_400_000);
  return Math.min(Math.max(days, 1), 7);
}

function placeScore(place: Place, interests: string[]) {
  const haystack = [place.name, place.category, place.neighbourhood, ...place.tags]
    .join(" ")
    .toLowerCase();

  return interests.reduce((total, interest) => {
    const needle = interest.trim().toLowerCase();
    if (needle.length < 3) return total;
    return haystack.includes(needle) ? total + 3 : total;
  }, 0);
}

function pickPlace(slot: ItinerarySlot, interests: string[], used: Set<string>) {
  const pool = barcelonaPlaces.filter((place) => slotCategories[slot].includes(place.category));
  const unvisited = pool.filter((place) => !used.has(place.id));
  const candidates = unvisited.length ? unvisited : pool;

  return (
    [...candidates].sort(
      (a, b) => placeScore(b, interests) - placeScore(a, interests) || a.distanceKm - b.distanceKm,
    )[0] ?? null
  );
}

export type PlannedStop = {
  day: number;
  slot: ItinerarySlot;
  title: string;
  placeId: string;
  notes: string;
};

/** Deterministic three-stops-a-day plan, ordered by the guest's interests. */
export function planStay(args: { days: number; interests?: string[] }): PlannedStop[] {
  const interests = args.interests ?? [];
  const days = Math.min(Math.max(Math.round(args.days), 1), 7);
  const used = new Set<string>();
  const stops: PlannedStop[] = [];

  for (let day = 1; day <= days; day += 1) {
    for (const slot of itinerarySlotOrder) {
      const place = pickPlace(slot, interests, used);
      if (!place) continue;
      used.add(place.id);
      stops.push({
        day,
        slot,
        title: place.name,
        placeId: place.id,
        notes: `${place.neighbourhood} · ${place.distanceKm} km from the apartment`,
      });
    }
  }

  return stops;
}

/** Group a saved plan into readable days, for chat replies and transcripts. */
export function formatItinerary(items: ItineraryItem[]) {
  if (!items.length) return "";

  const days = Array.from(new Set(items.map((item) => item.day))).sort((a, b) => a - b);

  return days
    .map((day) => {
      const stops = items
        .filter((item) => item.day === day)
        .sort((a, b) => slotRank(a.slot) - slotRank(b.slot))
        .map(
          (item) =>
            `- ${itinerarySlotLabels[item.slot]}: ${item.title}${
              item.notes ? ` — ${item.notes}` : ""
            }${item.done ? " (done)" : ""}`,
        );

      return `Day ${day}\n${stops.join("\n")}`;
    })
    .join("\n\n");
}

export function countPlannedStops(items: ItineraryItem[]) {
  return items.length;
}
