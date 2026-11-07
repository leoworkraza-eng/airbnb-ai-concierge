import { cache } from "react";
import { requireHostSession } from "./auth";
import { getHostRepo } from "./data";
import { demoPropertyInput, DEMO_HOST } from "./demo-data";
import { isAffiliationSession } from "./affiliations";
import type { Conversation, GuestSession, MaintenanceRequest, Notification, Property } from "./types";
import type { Repository } from "./data/repo";
import type { HostSession } from "./types";

/* Shared request context for every host page. */

export type HostWorkspace = {
  session: HostSession;
  repo: Repository;
  properties: Property[];
  notifications: Notification[];
  unread: number;
  requests: MaintenanceRequest[];
  conversations: Conversation[];
  guests: GuestSession[];
};

export const getHostWorkspace = cache(async (): Promise<HostWorkspace> => {
  const session = await requireHostSession();
  const repo = await getHostRepo();

  let properties = await repo.listProperties(session.hostId);

  // Only the documented demo host gets a starter property. A real host gets
  // exactly the offering they entered during onboarding.
  if (!properties.length && session.hostId === DEMO_HOST.id) {
    try {
      await repo.createProperty(session.hostId, demoPropertyInput(session.hostId));
      properties = await repo.listProperties(session.hostId);
    } catch (error) {
      console.error("[host] Could not seed the demo property", error);
    }
  }

  const propertyIds = properties.map((property) => property.id);

  const [notifications, requests, conversations, allGuests] = await Promise.all([
    repo.listNotifications(session.hostId).catch(() => []),
    repo.listMaintenanceRequests(propertyIds).catch(() => []),
    repo.listConversations(propertyIds).catch(() => []),
    repo.listGuestSessions(propertyIds).catch(() => []),
  ]);
  const guests = allGuests.filter((guest) => !isAffiliationSession(guest));

  return {
    session,
    repo,
    properties,
    notifications,
    unread: notifications.filter((notification) => !notification.read).length,
    requests,
    conversations,
    guests,
  };
});

export function propertyName(properties: Property[]) {
  if (properties.length === 0) return "No offering yet";
  if (properties.length === 1) return properties[0].name;
  return `${properties.length} offerings`;
}

export function activeGuests(guests: GuestSession[], dateISO: string) {
  return guests.filter(
    (guest) => guest.checkInDate <= dateISO && guest.checkOutDate >= dateISO,
  );
}
