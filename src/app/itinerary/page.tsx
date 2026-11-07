import { redirect } from "next/navigation";
import { GuestShell } from "@/components/guest/GuestShell";
import { ItineraryBoard } from "@/components/guest/ItineraryBoard";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestAccount } from "@/lib/guest-account";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { barcelonaPlaces } from "@/lib/demo-data";
import { itineraryDate, stayDayCount } from "@/lib/itinerary";
import type { ItineraryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Your plan" };
export const dynamic = "force-dynamic";

export default async function ItineraryPage() {
  const context = await getGuestContext();
  if (!context) {
    const account = await getGuestAccount();
    redirect(account ? "/stay" : "/guest/login?next=/itinerary");
  }

  const { guest, property } = context;
  const repo = await getGuestRepo();

  // The rest of the app keeps working before the itinerary migration runs.
  let items: ItineraryItem[] = [];
  let migration: string | null = null;
  try {
    items = await repo.listItinerary(guest.id);
  } catch (error) {
    if (error instanceof MigrationRequiredError) migration = error.message;
    else throw error;
  }

  const days = stayDayCount(guest.checkInDate, guest.checkOutDate);
  // Formatted on the server: Node and browser ICU builds disagree by a comma,
  // which used to make the day labels fail hydration.
  const dayLabels = Array.from({ length: days }, (_, index) =>
    formatDate(itineraryDate(guest.checkInDate, index + 1), { weekday: "long" }),
  );

  return (
    <GuestShell propertyName={property.name} active="itinerary" guestName={guest.guestName}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your plan</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold sm:text-[32px]">
            {days} day{days === 1 ? "" : "s"} in {property.city}, arranged.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            A saved, editable plan built from the curated guide
            {guest.preferences.interests.length
              ? ` and ordered around ${guest.preferences.interests.slice(0, 3).join(", ")}`
              : ""}
            . The concierge reads this same plan, so it can change a day for you.
          </p>
        </div>
      </div>

      <ItineraryBoard
        initialItems={items}
        days={days}
        dayLabels={dayLabels}
        migration={migration}
        interests={guest.preferences.interests}
        places={barcelonaPlaces.map((place) => ({
          id: place.id,
          name: place.name,
          category: place.category,
          neighbourhood: place.neighbourhood,
        }))}
      />
    </GuestShell>
  );
}
