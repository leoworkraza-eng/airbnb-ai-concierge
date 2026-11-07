import { getGuestRepo } from "./data";
import { offeringMeta } from "./offerings";
import type { Property } from "./types";

export type PublicOffering = {
  property: Property;
  typeLabel: string;
  category: string;
  priceLabel: string;
  duration: string;
};

export type PublicHost = {
  id: string;
  name: string;
  city: string;
  description: string;
  offerings: PublicOffering[];
  primaryPropertyId: string;
};

function toOffering(property: Property): PublicOffering {
  const meta = offeringMeta(property);
  return {
    property,
    typeLabel: meta.typeLabel,
    category: meta.category,
    priceLabel: meta.priceLabel,
    duration: meta.duration,
  };
}

/** Public directory. No host email or private dashboard data is exposed. */
export async function getPublicHosts(): Promise<PublicHost[]> {
  const repo = await getGuestRepo();
  const properties = await repo.listAllProperties();
  const groups = new Map<string, Property[]>();

  for (const property of properties) {
    const group = groups.get(property.hostId) ?? [];
    group.push(property);
    groups.set(property.hostId, group);
  }

  const hosts = await Promise.all(
    [...groups.entries()].map(async ([hostId, hostProperties]) => {
      const profile = await repo.getProfile(hostId);
      if (!profile) return null;

      return {
        id: hostId,
        name: profile.fullName || "Host",
        city: hostProperties[0]?.city || hostProperties[0]?.neighbourhood || "Barcelona",
        description: hostProperties[0]?.description || "A local host on Concierge.",
        offerings: hostProperties.map(toOffering),
        primaryPropertyId: hostProperties[0].id,
      } satisfies PublicHost;
    }),
  );

  return hosts
    .filter((host): host is PublicHost => Boolean(host))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPublicHost(hostId: string): Promise<PublicHost | null> {
  const hosts = await getPublicHosts();
  return hosts.find((host) => host.id === hostId) ?? null;
}
