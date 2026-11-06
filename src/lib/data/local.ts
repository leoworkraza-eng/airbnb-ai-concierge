import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  ChatRole,
  Conversation,
  GuestPreferences,
  GuestSession,
  HostIntegration,
  ItineraryItem,
  MaintenanceRequest,
  MaintenanceStatus,
  Message,
  Notification,
  Profile,
  Property,
  PropertyInput,
  Reservation,
  ToolEvent,
} from "../types";
import { newReservationCode, statusForDates } from "../reservations";
import { slotRank } from "../itinerary";
import {
  DEMO_GUEST,
  DEMO_HOST,
  DEMO_PROPERTY_ID,
  demoPropertyInput,
} from "../demo-data";
import { todayISO } from "../utils";
import {
  newTicketCode,
  type CreateGuestSessionInput,
  type CreateItineraryItemInput,
  type CreateRequestInput,
  type CreateReservationInput,
  type IntegrationPatch,
  type Repository,
} from "./repo";

/* ---------------------------------------------------------------------------
   Local development store.

   A single JSON file under `.data/` makes the whole product work — real writes,
   real persistence across restarts — before Supabase is configured. It is
   development-only: on Vercel the filesystem is read-only and this store
   refuses to start, so a deployment without Supabase fails loudly instead of
   pretending to save data.
   --------------------------------------------------------------------------- */

type LocalIntegration = HostIntegration & {
  credentials?: { clientId: string; clientSecret: string };
};

type LocalDb = {
  version: 1;
  profiles: Profile[];
  properties: Property[];
  guestSessions: GuestSession[];
  conversations: Conversation[];
  messages: Message[];
  maintenanceRequests: MaintenanceRequest[];
  notifications: Notification[];
  reservations: Reservation[];
  itinerary: ItineraryItem[];
  integrations: LocalIntegration[];
};

const DATA_DIR = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "concierge.json");

declare global {
  // eslint-disable-next-line no-var
  var __conciergeLocalDb: LocalDb | undefined;
  // eslint-disable-next-line no-var
  var __conciergeStoreQueue: Promise<unknown> | undefined;
}

function seedDb(): LocalDb {
  const now = new Date().toISOString();
  const property: Property = {
    id: DEMO_PROPERTY_ID,
    hostId: DEMO_HOST.id,
    ...demoPropertyInput(DEMO_HOST.id),
    createdAt: now,
    updatedAt: now,
  };

  const guestSessions: GuestSession[] = [
    {
      id: "guest-session-ana",
      propertyId: property.id,
      guestName: "Ana Ruiz",
      checkInDate: todayISO(-1),
      checkOutDate: todayISO(2),
      preferences: {
        interests: ["tapas", "architecture"],
        notes: "Travelling with her sister, prefers quiet mornings.",
        consent: true,
        updatedAt: now,
      },
      createdAt: now,
    },
    {
      id: "guest-session-thomas",
      propertyId: property.id,
      guestName: "Thomas Keller",
      checkInDate: todayISO(1),
      checkOutDate: todayISO(5),
      preferences: { interests: [], notes: "", consent: false },
      createdAt: now,
    },
  ];

  const conversation: Conversation = {
    id: "conversation-ana",
    guestSessionId: guestSessions[0].id,
    propertyId: property.id,
    summary:
      "Ana asked about the Wi-Fi and quiet breakfast spots near the apartment, then requested two extra pillows. No maintenance issues raised.",
    createdAt: now,
    lastMessageAt: now,
  };

  const messages: Message[] = [
    {
      id: "msg-1",
      conversationId: conversation.id,
      role: "user",
      content: "Hi! Where can I get a quiet breakfast near the apartment?",
      toolEvents: [],
      createdAt: now,
    },
    {
      id: "msg-2",
      conversationId: conversation.id,
      role: "assistant",
      content:
        "Good morning Ana — for a quiet breakfast I'd walk five minutes to Cafè de la Llum on Carrer de Mallorca, which opens early and is calm before 10:00. If you'd rather stay in, the Nespresso machine is in the kitchen with capsules in the drawer beside it.",
      toolEvents: [
        { name: "search_local_recommendations", label: "Searched the Barcelona guide", status: "ok" },
      ],
      createdAt: now,
    },
  ];

  const maintenanceRequests: MaintenanceRequest[] = [
    {
      id: "req-1",
      ticketCode: "MT-7K2P",
      propertyId: property.id,
      guestSessionId: guestSessions[0].id,
      guestName: guestSessions[0].guestName,
      description:
        "The bathroom extractor fan stays on and is quite loud at night. Not urgent, but it makes sleeping difficult.",
      category: "maintenance",
      priority: "normal",
      status: "in_progress",
      urgencyNote: "",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "req-2",
      ticketCode: "MT-3B9R",
      propertyId: property.id,
      guestSessionId: guestSessions[1].id,
      guestName: guestSessions[1].guestName,
      description:
        "Requesting a late check-out on Sunday, around 13:00 if the apartment is free.",
      category: "assistance",
      priority: "low",
      status: "new",
      urgencyNote: "",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ];

  const reservations: Reservation[] = [
    {
      id: "reservation-ana",
      code: "CB-7K2PA",
      propertyId: property.id,
      guestSessionId: guestSessions[0].id,
      guestName: guestSessions[0].guestName,
      guestEmail: "ana.ruiz@example.com",
      checkInDate: guestSessions[0].checkInDate,
      checkOutDate: guestSessions[0].checkOutDate,
      guests: 2,
      status: "in_house",
      source: "demo",
      externalId: null,
      notes: "Travelling with her sister. Prefers quiet mornings.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      updatedAt: now,
    },
    {
      id: "reservation-thomas",
      code: "CB-3B9RM",
      propertyId: property.id,
      guestSessionId: guestSessions[1].id,
      guestName: guestSessions[1].guestName,
      guestEmail: "t.keller@example.com",
      checkInDate: guestSessions[1].checkInDate,
      checkOutDate: guestSessions[1].checkOutDate,
      guests: 1,
      status: "upcoming",
      source: "demo",
      externalId: null,
      notes: "",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      updatedAt: now,
    },
    {
      id: "reservation-open",
      code: newReservationCode("demo"),
      propertyId: property.id,
      guestSessionId: null,
      guestName: "Next guest",
      guestEmail: "",
      checkInDate: todayISO(0),
      checkOutDate: todayISO(4),
      guests: 2,
      status: "upcoming",
      source: "demo",
      externalId: null,
      notes: "Unassigned demo reservation, claimed by the next guest session.",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const notifications: Notification[] = [
    {
      id: "note-1",
      hostId: DEMO_HOST.id,
      propertyId: property.id,
      message: "Ana Ruiz reported a noisy bathroom extractor fan (MT-7K2P).",
      type: "maintenance",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: "note-2",
      hostId: DEMO_HOST.id,
      propertyId: property.id,
      message: "Thomas Keller asked about a late check-out (MT-3B9R).",
      type: "service",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ];

  return {
    version: 1,
    profiles: [
      {
        id: DEMO_HOST.id,
        email: DEMO_HOST.email,
        fullName: DEMO_HOST.fullName,
        role: "host",
        createdAt: now,
      },
    ],
    properties: [property],
    guestSessions,
    conversations: [conversation],
    messages,
    maintenanceRequests,
    notifications,
    reservations,
    itinerary: [],
    integrations: [],
  };
}

async function load(): Promise<LocalDb> {
  if (process.env.VERCEL && !process.env.LOCAL_DATA_DIR) {
    throw new Error(
      "No persistent store is configured. Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to run in production.",
    );
  }

  if (globalThis.__conciergeLocalDb) return globalThis.__conciergeLocalDb;

  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as LocalDb;
    // Stores written before reservations existed are upgraded in place.
    parsed.reservations ??= [];
    parsed.itinerary ??= [];
    parsed.integrations ??= [];
    globalThis.__conciergeLocalDb = parsed;
    return parsed;
  } catch {
    const fresh = seedDb();
    await fs.writeFile(DATA_FILE, JSON.stringify(fresh, null, 2), "utf8");
    globalThis.__conciergeLocalDb = fresh;
    return fresh;
  }
}

/** Serialise read-modify-write cycles so concurrent requests never clobber. */
async function mutate<T>(fn: (db: LocalDb) => T): Promise<T> {
  const run = async () => {
    const db = await load();
    const result = fn(db);
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
    return result;
  };
  const previous = globalThis.__conciergeStoreQueue ?? Promise.resolve();
  const next = previous.then(run, run);
  globalThis.__conciergeStoreQueue = next.catch(() => undefined);
  return next;
}

const clone = <T,>(value: T): T => structuredClone(value);

/** Integration rows never leave the data layer with their credentials attached. */
function safeIntegration(row: LocalIntegration): HostIntegration {
  const { credentials, ...rest } = row;
  return clone({ ...rest, hasCredentials: Boolean(credentials?.clientSecret) });
}

export class LocalRepository implements Repository {
  readonly mode = "local" as const;

  async getProperty(id: string) {
    const db = await load();
    const found = db.properties.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async getPrimaryProperty() {
    const db = await load();
    const pinned = process.env.DEMO_PROPERTY_ID;
    const found =
      (pinned && db.properties.find((p) => p.id === pinned)) ||
      db.properties.find((p) => p.name === "Casa Barcelona") ||
      db.properties[0];
    return found ? clone(found) : null;
  }

  async listProperties(hostId: string) {
    const db = await load();
    return db.properties
      .filter((p) => p.hostId === hostId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(clone);
  }

  async createProperty(hostId: string, input: PropertyInput) {
    return mutate((db) => {
      const now = new Date().toISOString();
      const property: Property = {
        ...input,
        id: crypto.randomUUID(),
        hostId,
        createdAt: now,
        updatedAt: now,
      };
      db.properties.push(property);
      return clone(property);
    });
  }

  async updateProperty(id: string, hostId: string, patch: Partial<PropertyInput>) {
    return mutate((db) => {
      const index = db.properties.findIndex((p) => p.id === id && p.hostId === hostId);
      if (index === -1) return null;
      const updated: Property = {
        ...db.properties[index],
        ...patch,
        settings: { ...db.properties[index].settings, ...(patch.settings ?? {}) },
        updatedAt: new Date().toISOString(),
      };
      db.properties[index] = updated;
      return clone(updated);
    });
  }

  async createGuestSession(input: CreateGuestSessionInput) {
    return mutate((db) => {
      const session: GuestSession = {
        id: crypto.randomUUID(),
        propertyId: input.propertyId,
        guestName: input.guestName,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        preferences:
          input.preferences ?? { interests: [], notes: "", consent: false },
        createdAt: new Date().toISOString(),
      };
      db.guestSessions.push(session);
      return clone(session);
    });
  }

  async getGuestSession(id: string) {
    const db = await load();
    const found = db.guestSessions.find((s) => s.id === id);
    return found ? clone(found) : null;
  }

  async listGuestSessions(propertyIds: string[]) {
    const db = await load();
    return db.guestSessions
      .filter((s) => propertyIds.includes(s.propertyId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async updateGuestPreferences(id: string, preferences: GuestPreferences) {
    return mutate((db) => {
      const session = db.guestSessions.find((s) => s.id === id);
      if (!session) return null;
      session.preferences = preferences;
      return clone(session);
    });
  }

  async getOrCreateConversation(guestSessionId: string, propertyId: string) {
    return mutate((db) => {
      const existing = db.conversations.find(
        (c) => c.guestSessionId === guestSessionId,
      );
      if (existing) return clone(existing);
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        guestSessionId,
        propertyId,
        summary: null,
        createdAt: now,
        lastMessageAt: now,
      };
      db.conversations.push(conversation);
      return clone(conversation);
    });
  }

  async getConversation(id: string) {
    const db = await load();
    const found = db.conversations.find((c) => c.id === id);
    return found ? clone(found) : null;
  }

  async listConversations(propertyIds: string[]) {
    const db = await load();
    return db.conversations
      .filter((c) => propertyIds.includes(c.propertyId))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map(clone);
  }

  async setConversationSummary(id: string, summary: string) {
    await mutate((db) => {
      const conversation = db.conversations.find((c) => c.id === id);
      if (conversation) conversation.summary = summary;
    });
  }

  async listMessages(conversationId: string, limit = 200) {
    const db = await load();
    return db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit)
      .map(clone);
  }

  async addMessage(input: {
    conversationId: string;
    role: ChatRole;
    content: string;
    toolEvents?: ToolEvent[];
  }) {
    return mutate((db) => {
      const now = new Date().toISOString();
      const message: Message = {
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        toolEvents: input.toolEvents ?? [],
        createdAt: now,
      };
      db.messages.push(message);
      const conversation = db.conversations.find(
        (c) => c.id === input.conversationId,
      );
      if (conversation) conversation.lastMessageAt = now;
      return clone(message);
    });
  }

  async createMaintenanceRequest(input: CreateRequestInput) {
    return mutate((db) => {
      const now = new Date().toISOString();
      const request: MaintenanceRequest = {
        id: crypto.randomUUID(),
        ticketCode: newTicketCode(),
        propertyId: input.propertyId,
        guestSessionId: input.guestSessionId,
        guestName: input.guestName,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "new",
        urgencyNote: input.urgencyNote ?? "",
        createdAt: now,
        updatedAt: now,
      };
      db.maintenanceRequests.push(request);
      return clone(request);
    });
  }

  async listMaintenanceRequests(propertyIds: string[]) {
    const db = await load();
    return db.maintenanceRequests
      .filter((r) => propertyIds.includes(r.propertyId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async listMaintenanceForGuest(guestSessionId: string) {
    const db = await load();
    return db.maintenanceRequests
      .filter((r) => r.guestSessionId === guestSessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async updateMaintenanceStatus(
    id: string,
    status: MaintenanceStatus,
    propertyIds: string[],
  ) {
    return mutate((db) => {
      const request = db.maintenanceRequests.find(
        (r) => r.id === id && propertyIds.includes(r.propertyId),
      );
      if (!request) return null;
      request.status = status;
      request.updatedAt = new Date().toISOString();
      return clone(request);
    });
  }

  async createNotification(input: {
    hostId: string;
    propertyId: string | null;
    message: string;
    type: Notification["type"];
  }) {
    return mutate((db) => {
      const notification: Notification = {
        id: crypto.randomUUID(),
        hostId: input.hostId,
        propertyId: input.propertyId,
        message: input.message,
        type: input.type,
        read: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.push(notification);
      return clone(notification);
    });
  }

  async listNotifications(hostId: string) {
    const db = await load();
    return db.notifications
      .filter((n) => n.hostId === hostId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async markNotificationsRead(hostId: string) {
    await mutate((db) => {
      db.notifications.forEach((n) => {
        if (n.hostId === hostId) n.read = true;
      });
    });
  }

  async listReservations(propertyIds: string[]) {
    const db = await load();
    return db.reservations
      .filter((reservation) => propertyIds.includes(reservation.propertyId))
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
      .map(clone);
  }

  async getReservation(id: string) {
    const db = await load();
    const found = db.reservations.find((reservation) => reservation.id === id);
    return found ? clone(found) : null;
  }

  async getReservationForGuest(guestSessionId: string) {
    const db = await load();
    const found = db.reservations.find(
      (reservation) => reservation.guestSessionId === guestSessionId,
    );
    return found ? clone(found) : null;
  }

  async getReservationByCode(code: string) {
    const db = await load();
    const normalized = code.trim().toUpperCase();
    const found = db.reservations.find(
      (reservation) => reservation.code.toUpperCase() === normalized,
    );
    return found ? clone(found) : null;
  }

  async listReservationsByEmail(email: string) {
    const db = await load();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return [];
    return db.reservations
      .filter((reservation) => reservation.guestEmail.toLowerCase() === normalized)
      .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate))
      .map(clone);
  }

  async createReservation(hostId: string, input: CreateReservationInput) {
    return mutate((db) => {
      const property = db.properties.find(
        (candidate) => candidate.id === input.propertyId && candidate.hostId === hostId,
      );
      if (!property) throw new Error("That property isn't on this account.");

      const now = new Date().toISOString();
      const reservation: Reservation = {
        id: crypto.randomUUID(),
        code: input.code ?? newReservationCode(input.source ?? "manual"),
        propertyId: input.propertyId,
        guestSessionId: input.guestSessionId ?? null,
        guestName: input.guestName,
        guestEmail: input.guestEmail ?? "",
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        guests: input.guests,
        status: input.status ?? "upcoming",
        source: input.source ?? "manual",
        externalId: input.externalId ?? null,
        notes: input.notes ?? "",
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(reservation);
      return clone(reservation);
    });
  }

  async updateReservationStatus(
    id: string,
    status: Reservation["status"],
    propertyIds: string[],
  ) {
    return mutate((db) => {
      const reservation = db.reservations.find(
        (candidate) => candidate.id === id && propertyIds.includes(candidate.propertyId),
      );
      if (!reservation) return null;
      reservation.status = status;
      reservation.updatedAt = new Date().toISOString();
      return clone(reservation);
    });
  }

  async attachReservationToGuest(reservationId: string, guestSessionId: string) {
    return mutate((db) => {
      const reservation = db.reservations.find(
        (candidate) => candidate.id === reservationId,
      );
      if (!reservation) return null;
      reservation.guestSessionId = guestSessionId;
      reservation.updatedAt = new Date().toISOString();
      return clone(reservation);
    });
  }

  async linkReservationToGuest(propertyId: string, guest: GuestSession) {
    return mutate((db) => {
      const existing = db.reservations.find(
        (reservation) => reservation.guestSessionId === guest.id,
      );
      if (existing) return clone(existing);

      const open = db.reservations.find(
        (reservation) =>
          reservation.propertyId === propertyId &&
          !reservation.guestSessionId &&
          (reservation.status === "upcoming" || reservation.status === "in_house"),
      );

      if (open) {
        open.guestSessionId = guest.id;
        open.guestName = guest.guestName;
        open.guestEmail ||= DEMO_GUEST.email;
        open.checkInDate = guest.checkInDate;
        open.checkOutDate = guest.checkOutDate;
        open.status = statusForDates(guest.checkInDate, guest.checkOutDate, todayISO(0));
        open.updatedAt = new Date().toISOString();
        return clone(open);
      }

      const now = new Date().toISOString();
      const reservation: Reservation = {
        id: crypto.randomUUID(),
        code: newReservationCode("demo"),
        propertyId,
        guestSessionId: guest.id,
        guestName: guest.guestName,
        guestEmail: DEMO_GUEST.email,
        checkInDate: guest.checkInDate,
        checkOutDate: guest.checkOutDate,
        guests: 2,
        status: statusForDates(guest.checkInDate, guest.checkOutDate, todayISO(0)),
        source: "demo",
        externalId: null,
        notes: "Created for the demo guest session.",
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(reservation);
      return clone(reservation);
    });
  }

  async getIntegration(hostId: string) {
    const db = await load();
    const found = db.integrations.find(
      (integration) => integration.hostId === hostId && integration.provider === "airbnb",
    );
    return found ? safeIntegration(found) : null;
  }

  async saveIntegration(hostId: string, patch: IntegrationPatch) {
    return mutate((db) => {
      const now = new Date().toISOString();
      let row = db.integrations.find(
        (integration) => integration.hostId === hostId && integration.provider === "airbnb",
      );

      if (!row) {
        row = {
          id: crypto.randomUUID(),
          hostId,
          provider: "airbnb",
          status: "not_connected",
          mode: "oauth",
          accountRef: "",
          hasCredentials: false,
          lastSyncAt: null,
          lastError: "",
          events: [],
          createdAt: now,
          updatedAt: now,
        };
        db.integrations.push(row);
      }

      if (patch.status !== undefined) row.status = patch.status;
      if (patch.mode !== undefined) row.mode = patch.mode;
      if (patch.accountRef !== undefined) row.accountRef = patch.accountRef;
      if (patch.lastSyncAt !== undefined) row.lastSyncAt = patch.lastSyncAt;
      if (patch.lastError !== undefined) row.lastError = patch.lastError;
      if (patch.events !== undefined) row.events = patch.events.slice(0, 20);
      if (patch.credentials !== undefined) {
        row.credentials = patch.credentials ?? undefined;
        row.hasCredentials = Boolean(patch.credentials);
      }

      row.updatedAt = now;
      return safeIntegration(row);
    });
  }

  async listItinerary(guestSessionId: string) {
    const db = await load();
    return (db.itinerary ?? [])
      .filter((item) => item.guestSessionId === guestSessionId)
      .sort(
        (a, b) =>
          a.day - b.day ||
          slotRank(a.slot) - slotRank(b.slot) ||
          a.createdAt.localeCompare(b.createdAt),
      )
      .map(clone);
  }

  async addItineraryItem(input: CreateItineraryItemInput) {
    return mutate((db) => {
      if (!db.itinerary) db.itinerary = [];
      const now = new Date().toISOString();
      const item: ItineraryItem = {
        id: crypto.randomUUID(),
        guestSessionId: input.guestSessionId,
        propertyId: input.propertyId,
        day: input.day,
        slot: input.slot,
        title: input.title,
        placeId: input.placeId ?? null,
        notes: input.notes ?? "",
        done: false,
        createdAt: now,
        updatedAt: now,
      };
      db.itinerary.push(item);
      return clone(item);
    });
  }

  async updateItineraryItem(
    id: string,
    guestSessionId: string,
    patch: { done?: boolean; title?: string; notes?: string },
  ) {
    return mutate((db) => {
      const item = (db.itinerary ?? []).find(
        (entry) => entry.id === id && entry.guestSessionId === guestSessionId,
      );
      if (!item) return null;
      if (patch.done !== undefined) item.done = patch.done;
      if (patch.title !== undefined) item.title = patch.title;
      if (patch.notes !== undefined) item.notes = patch.notes;
      item.updatedAt = new Date().toISOString();
      return clone(item);
    });
  }

  async removeItineraryItem(id: string, guestSessionId: string) {
    return mutate((db) => {
      const before = (db.itinerary ?? []).length;
      db.itinerary = (db.itinerary ?? []).filter(
        (entry) => !(entry.id === id && entry.guestSessionId === guestSessionId),
      );
      return db.itinerary.length < before;
    });
  }

  async clearItinerary(guestSessionId: string) {
    await mutate((db) => {
      db.itinerary = (db.itinerary ?? []).filter(
        (entry) => entry.guestSessionId !== guestSessionId,
      );
    });
  }

  async getProfile(id: string) {
    const db = await load();
    const found = db.profiles.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async getProfileByEmail(email: string) {
    const db = await load();
    const found = db.profiles.find(
      (p) => p.email.toLowerCase() === email.toLowerCase(),
    );
    return found ? clone(found) : null;
  }

  async ensureProfile(input: {
    id?: string;
    email: string;
    fullName: string;
    role?: Profile["role"];
  }) {
    return mutate((db) => {
      const existing = db.profiles.find(
        (p) => p.email.toLowerCase() === input.email.toLowerCase(),
      );
      if (existing) return clone(existing);
      const profile: Profile = {
        id: input.id ?? crypto.randomUUID(),
        email: input.email,
        fullName: input.fullName,
        role: input.role ?? "host",
        createdAt: new Date().toISOString(),
      };
      db.profiles.push(profile);
      return clone(profile);
    });
  }
}
