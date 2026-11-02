import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Coffee,
  Compass,
  Info,
  Landmark,
  MapPin,
  Music,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { Card, Pill } from "@/components/ui";
import { getGuestContext } from "@/lib/guest-context";
import { barcelonaPlaces } from "@/lib/demo-data";
import { googlePlacesEnabled } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";

export const metadata = { title: "Explore Barcelona" };
export const dynamic = "force-dynamic";

const categoryMeta: Record<
  Place["category"],
  { label: string; icon: typeof Utensils }
> = {
  restaurant: { label: "Restaurants", icon: Utensils },
  cafe: { label: "Cafés", icon: Coffee },
  nightlife: { label: "Nightlife", icon: Music },
  culture: { label: "Culture", icon: Landmark },
  shopping: { label: "Shopping", icon: ShoppingBag },
  outdoors: { label: "Outdoors", icon: Trees },
  market: { label: "Markets", icon: ShoppingBag },
};

const priceLabel = (price: number) => (price === 1 ? "€" : price === 2 ? "€€" : "€€€");

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const context = await getGuestContext();
  if (!context) redirect("/api/guest/start");

  const { property, guest } = context;
  const { category } = await searchParams;
  const active =
    category && category in categoryMeta ? (category as Place["category"]) : "all";

  const places =
    active === "all"
      ? barcelonaPlaces
      : barcelonaPlaces.filter((place) => place.category === active);

  const interests = guest.preferences.interests;

  return (
    <GuestShell propertyName={property.name} active="explore" guestName={guest.guestName}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore Barcelona</p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold">
            Around {property.neighbourhood}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            A starting point from the apartment — walkable neighbourhoods, Gaudí,
            markets and low-key places to eat. Ask the concierge to narrow it down.
          </p>
        </div>
        <Link href="/concierge" className="btn-secondary btn-sm">
          <Sparkles className="size-3.5 text-brand" /> Personalise with the concierge
        </Link>
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-[12px] leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-soft" />
        <p>
          <span className="font-medium text-ink-soft">Curated demonstration guide.</span>{" "}
          Venue details marked &ldquo;prototype venue&rdquo; are fictional and written for
          this academic prototype. Opening hours, availability and prices are not
          verified live — check before you go.{" "}
          {googlePlacesEnabled
            ? "The concierge can also query live Google Places results."
            : "No Google Places key is configured, so the concierge uses this dataset only."}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href="/explore"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition",
            active === "all"
              ? "border-ink bg-ink text-cream"
              : "border-line bg-white text-ink-soft hover:border-ink/25",
          )}
        >
          Everything
        </Link>
        {Object.entries(categoryMeta).map(([key, meta]) => (
          <Link
            key={key}
            href={`/explore?category=${key}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition",
              active === key
                ? "border-ink bg-ink text-cream"
                : "border-line bg-white text-ink-soft hover:border-ink/25",
            )}
          >
            <meta.icon className="size-3.5" strokeWidth={1.8} />
            {meta.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => {
          const meta = categoryMeta[place.category];
          const matches = interests.some((interest) =>
            [place.name, place.description, place.category, ...place.tags]
              .join(" ")
              .toLowerCase()
              .includes(interest.toLowerCase()),
          );
          return (
            <Card key={place.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-sand text-ink-soft">
                  <meta.icon className="size-4" strokeWidth={1.8} />
                </span>
                <div className="flex items-center gap-1.5">
                  {matches ? <Pill tone="brand">For you</Pill> : null}
                  <Pill tone="neutral">{priceLabel(place.price)}</Pill>
                </div>
              </div>
              <h2 className="mt-3 text-[15px] leading-snug font-semibold">{place.name}</h2>
              <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted">
                <MapPin className="size-3" /> {place.neighbourhood} · {place.distanceKm} km
              </p>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted">
                {place.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {place.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-cream px-2 py-0.5 text-[10.5px] text-ink-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={`/concierge?prompt=${encodeURIComponent(
                  `Tell me more about ${place.name} and whether it fits my plans.`,
                )}`}
                className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:text-brand-dark"
              >
                Ask the concierge <ArrowRight className="size-3" />
              </Link>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Compass className="size-4.5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold">Getting around</h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
              Metro Passeig de Gràcia (L2/L3/L4) is five minutes away. For live
              traffic or service alerts, check a maps app — the concierge
              deliberately doesn&rsquo;t invent real-time information.
            </p>
          </div>
        </div>
        <Link
          href={`/concierge?prompt=${encodeURIComponent(
            "What's the best way to get around Barcelona from the apartment?",
          )}`}
          className="btn-secondary btn-sm shrink-0"
        >
          Ask about transport
        </Link>
      </Card>
    </GuestShell>
  );
}
