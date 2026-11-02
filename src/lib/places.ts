import { env, googlePlacesEnabled } from "./env";
import { LIVE_TRANSPORT_UNAVAILABLE, barcelonaPlaces } from "./demo-data";
import type { Place } from "./types";

/* ---------------------------------------------------------------------------
   Local discovery.

   Default source: the curated Barcelona dataset that ships with the prototype.
   Optional source: Google Places Text Search, used only when a key is present
   and only server-side. Results always carry their `source` so the concierge
   can be honest about where the information came from.
   --------------------------------------------------------------------------- */

export type Recommendation = {
  name: string;
  category: string;
  neighbourhood: string;
  description: string;
  price: string;
  distanceKm?: number;
  source: "curated_demo_dataset" | "google_places";
  openNow?: boolean;
  address?: string;
};

const priceLabel = (price: number) => {
  if (price <= 1) return "€";
  if (price === 2) return "€€";
  return "€€€";
};

function scorePlace(
  place: Place,
  interests: string[],
  categories: string[],
  budget: string | undefined,
  timeOfDay: string | undefined,
  maxDistanceKm: number | undefined,
) {
  let score = 0;
  const needles = interests.map((i) => i.toLowerCase());
  const haystack = [place.category, ...place.tags, place.name, place.description]
    .join(" ")
    .toLowerCase();

  for (const needle of needles) {
    if (haystack.includes(needle)) score += 4;
  }
  if (categories.includes(place.category)) score += 5;
  if (budget === "low" && place.price === 1) score += 3;
  if (budget === "mid" && place.price === 2) score += 2;
  if (budget === "high" && place.price === 3) score += 2;
  if (timeOfDay && place.bestTime === timeOfDay) score += 3;
  if (maxDistanceKm) {
    if (place.distanceKm <= maxDistanceKm) score += 2;
    else score -= 2;
  }
  // Prefer things close to the apartment when the guest has no other signals.
  score += Math.max(0, 3 - place.distanceKm);
  return score;
}

export async function searchPlaces(input: {
  interests?: string[];
  categories?: string[];
  budget?: "low" | "mid" | "high";
  timeOfDay?: "morning" | "afternoon" | "evening";
  maxDistanceKm?: number;
  limit?: number;
  neighbourhood?: string;
}): Promise<{ items: Recommendation[]; source: "curated_demo_dataset" | "google_places"; note?: string }> {
  const interests = input.interests ?? [];
  const categories = input.categories ?? [];
  const limit = Math.min(Math.max(input.limit ?? 4, 1), 8);

  if (googlePlacesEnabled) {
    try {
      const live = await googleTextSearch(
        [interests.join(" "), categories.join(" "), input.neighbourhood ?? "Barcelona"]
          .filter(Boolean)
          .join(" "),
        limit,
      );
      if (live.length) {
        return {
          items: live,
          source: "google_places",
          note: "Live Google Places results. Opening status is provided by Google; prices are not.",
        };
      }
    } catch {
      // Fall through to the curated dataset with an honest note.
    }
  }

  const ranked = [...barcelonaPlaces]
    .map((place) => ({
      place,
      score: scorePlace(
        place,
        interests,
        categories,
        input.budget,
        input.timeOfDay,
        input.maxDistanceKm,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ place }) => ({
      name: place.name,
      category: place.category,
      neighbourhood: place.neighbourhood,
      description: place.description,
      price: priceLabel(place.price),
      distanceKm: place.distanceKm,
      source: "curated_demo_dataset" as const,
    }));

  return {
    items: ranked,
    source: "curated_demo_dataset",
    note:
      "Curated demonstration dataset for this prototype — not live venue data. Opening hours, availability and current prices are unverified." +
      (googlePlacesEnabled ? " Google Places could not be reached, so the curated guide was used." : ""),
  };
}

async function googleTextSearch(query: string, limit: number): Promise<Recommendation[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours.openNow,places.priceLevel,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: limit, languageCode: "en" }),
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`Places API responded ${response.status}`);
  const data = (await response.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      currentOpeningHours?: { openNow?: boolean };
      priceLevel?: string;
      primaryTypeDisplayName?: { text?: string };
    }>;
  };

  return (data.places ?? []).map((place) => ({
    name: place.displayName?.text ?? "Unnamed place",
    category: place.primaryTypeDisplayName?.text ?? "place",
    neighbourhood: "",
    description: "Live result from Google Places. Check the listing for details.",
    price: place.priceLevel ? place.priceLevel.replace("PRICE_LEVEL_", "").toLowerCase() : "unknown",
    address: place.formattedAddress,
    openNow: place.currentOpeningHours?.openNow,
    source: "google_places" as const,
  }));
}

export const transportNotice = LIVE_TRANSPORT_UNAVAILABLE;
