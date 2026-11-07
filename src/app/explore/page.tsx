import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Compass,
  Info,
  Landmark,
  MapPin,
  MapPinned,
  Music,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react";
import { GuestShell } from "@/components/guest/GuestShell";
import { Card, Pill } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestAccount } from "@/lib/guest-account";
import { barcelonaPlaces } from "@/lib/demo-data";
import { googlePlacesEnabled } from "@/lib/env";
import { placePhoto } from "@/lib/media";
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

/* OpenStreetMap's standard embed needs no key and is a widely used, standard
   integration — so the map is genuinely live without inventing a provider. */
const MAP_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=2.1485%2C41.3835%2C2.1815%2C41.4005&layer=mapnik&marker=41.3925%2C2.1649";
const MAP_LINK = "https://www.openstreetmap.org/?mlat=41.3925&mlon=2.1649#map=16/41.3925/2.1649";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const context = await getGuestContext();
  if (!context) {
    const account = await getGuestAccount();
    redirect(account ? "/stay" : "/guest/login?next=/explore");
  }

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
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold sm:text-[32px]">
            Around {property.neighbourhood}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            A starting point from the apartment — walkable neighbourhoods, Gaudí,
            markets, places to eat, and a nightlife list with real club, bar and lounge
            labels. Ask the concierge to narrow it down.
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
          Venue details are fictional and written for this academic prototype. Opening
          hours, availability and prices are not verified live — check before you go.
          Photos are representative of the area, not of the venues.{" "}
          {googlePlacesEnabled
            ? "The concierge can also query live Google Places results."
            : "No Google Places key is configured, so the concierge uses this dataset only."}
        </p>
      </div>

      {active === "nightlife" ? (
        <p className="mb-4 rounded-xl border border-line bg-white px-4 py-2.5 text-[12px] text-muted">
          <span className="font-medium text-ink">Nightlife:</span> clubs, bars and
          lounges are labelled on each card.
        </p>
      ) : null}

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
        {places.map((place, index) => {
          const meta = categoryMeta[place.category];
          const photo = placePhoto(place);
          const matches = interests.some((interest) =>
            [place.name, place.description, place.category, ...place.tags]
              .join(" ")
              .toLowerCase()
              .includes(interest.toLowerCase()),
          );

          return (
            <Reveal
              key={place.id}
              delay={(index % 3) * 70}
              y={20}
              blur={false}
              className="h-full"
            >
              <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition duration-500 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_26px_50px_-36px_rgba(25,19,16,0.55)]">
                <div className="media-frame relative aspect-4/3 bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={1600}
                    height={1200}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,11,9,0.05)_35%,rgba(15,11,9,0.62)_100%)]" />
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur-md">
                      <meta.icon className="size-3" strokeWidth={2} />
                      {place.subtype ?? meta.label}
                    </span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-ink">
                      {priceLabel(place.price)}
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-3">
                    <h2 className="text-[16px] leading-tight font-semibold text-white">
                      {place.name}
                    </h2>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/75">
                      <MapPin className="size-3" /> {place.neighbourhood} ·{" "}
                      {place.distanceKm} km
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {matches ? <Pill tone="brand">For you</Pill> : null}
                    {place.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-cream px-2 py-0.5 text-[10.5px] text-ink-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted">
                    {place.description}
                  </p>
                  <Link
                    href={`/concierge?prompt=${encodeURIComponent(
                      `Tell me more about ${place.name} and whether it fits my plans.`,
                    )}`}
                    className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5 hover:text-brand-dark"
                  >
                    Ask the concierge <ArrowRight className="size-3" />
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* Map */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <MapPinned className="size-4 text-brand" />
              <h2 className="text-[13.5px] font-semibold">
                The apartment, on the map
              </h2>
            </div>
            <span className="text-[10.5px] text-muted">OpenStreetMap · live tiles</span>
          </div>
          <div className="relative aspect-16/10 w-full bg-sand">
            <iframe
              title="Map of Carrer de Mallorca 245, Barcelona, and the surrounding Eixample streets"
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
            <p className="text-[11px] text-muted">
              Carrer de Mallorca 245 · Eixample · Metro Passeig de Gràcia (L2/L3/L4)
            </p>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft transition hover:text-ink"
            >
              Open larger map <ArrowUpRight className="size-3" />
            </a>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Compass className="size-4.5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold">Getting around</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
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
            className="btn-secondary btn-sm self-start"
          >
            Ask about transport
          </Link>
        </Card>
      </section>
    </GuestShell>
  );
}
