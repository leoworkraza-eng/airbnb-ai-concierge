import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";
import { DEMO_GUEST } from "../demo-data";
import type {
  ChatRole,
  Conversation,
  GuestPreferences,
  GuestSession,
  HostIntegration,
  IntegrationEvent,
  ItineraryItem,
  ItinerarySlot,
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
import { todayISO } from "../utils";
import {
  MigrationRequiredError,
  newTicketCode,
  type CreateGuestSessionInput,
  type CreateItineraryItemInput,
  type CreateRequestInput,
  type CreateReservationInput,
  type IntegrationPatch,
  type Repository,
} from "./repo";

/* ---------------------------------------------------------------------------
   Supabase repository.

   Instantiated twice:
   - with the service-role client for guest/AI server flows;
   - with the request-scoped user client for host flows, so Row Level Security
     is the final enforcement on every host query.
   --------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const nullableStr = (value: unknown): string | null =>
  typeof value === "string" ? value : null;
const arr = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

function mapProperty(row: Row): Property {
  const settings = (row.settings ?? {}) as Record<string, unknown>;
  return {
    id: str(row.id),
    hostId: str(row.host_id),
    name: str(row.name),
    address: str(row.address),
    neighbourhood: str(row.neighbourhood),
    city: str(row.city),
    description: str(row.description),
    hostName: str(row.host_name),
    hostPhone: str(row.host_phone),
    hostEmail: str(row.host_email),
    checkIn: str(row.check_in, "15:00"),
    checkOut: str(row.check_out, "11:00"),
    checkInInstructions: str(row.check_in_instructions),
    checkOutInstructions: str(row.check_out_instructions),
    wifiName: str(row.wifi_name),
    wifiPassword: str(row.wifi_password),
    houseRules: arr<string>(row.house_rules),
    amenities: arr<string>(row.amenities),
    applianceInstructions: arr<Property["applianceInstructions"][number]>(
      row.appliance_instructions,
    ),
    emergencyInformation: str(row.emergency_information),
    faqs: arr<Property["faqs"][number]>(row.faqs),
    settings: {
      tone:
        settings.tone === "professional" || settings.tone === "luxury"
          ? settings.tone
          : "warm",
      extraInstructions: str(settings.extraInstructions),
      servicePreferences: str(settings.servicePreferences),
      escalationInstructions: str(settings.escalationInstructions),
      offeringType:
        settings.offeringType === "activity" || settings.offeringType === "service"
          ? settings.offeringType
          : settings.offeringType === "stay"
            ? "stay"
            : undefined,
      offeringCategory: str(settings.offeringCategory) || undefined,
      priceLabel: str(settings.priceLabel) || undefined,
      duration: str(settings.duration) || undefined,
    },
    createdAt: str(row.created_at, new Date().toISOString()),
    updatedAt: str(row.updated_at, new Date().toISOString()),
  };
}

function propertyColumns(input: PropertyInput) {
  return {
    name: input.name,
    address: input.address,
    neighbourhood: input.neighbourhood,
    city: input.city,
    description: input.description,
    host_name: input.hostName,
    host_phone: input.hostPhone,
    host_email: input.hostEmail,
    check_in: input.checkIn,
    check_out: input.checkOut,
    check_in_instructions: input.checkInInstructions,
    check_out_instructions: input.checkOutInstructions,
    wifi_name: input.wifiName,
    wifi_password: input.wifiPassword,
    house_rules: input.houseRules,
    amenities: input.amenities,
    appliance_instructions: input.applianceInstructions,
    emergency_information: input.emergencyInformation,
    faqs: input.faqs,
    settings: input.settings,
  };
}

function mapAffiliation(value: unknown): GuestSession["preferences"]["affiliation"] {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Row;
  const status = str(source.status);
  if (
    typeof source.guestUserId !== "string" ||
    !["pending", "accepted", "declined"].includes(status) ||
    typeof source.hostId !== "string"
  ) {
    return undefined;
  }
  return {
    id: str(source.id),
    guestUserId: source.guestUserId,
    guestName: str(source.guestName),
    guestEmail: str(source.guestEmail),
    hostId: source.hostId,
    hostName: str(source.hostName),
    propertyId: str(source.propertyId),
    propertyName: str(source.propertyName),
    status: status as "pending" | "accepted" | "declined",
    initiatedBy: source.initiatedBy === "host" ? "host" : "guest",
    reservationId: nullableStr(source.reservationId),
    createdAt: str(source.createdAt, new Date().toISOString()),
    updatedAt: str(source.updatedAt, new Date().toISOString()),
  };
}

function mapGuestSession(row: Row): GuestSession {
  const prefs = (row.preferences ?? {}) as Record<string, unknown>;
  return {
    id: str(row.id),
    propertyId: str(row.property_id),
    guestName: str(row.guest_name),
    checkInDate: str(row.check_in_date),
    checkOutDate: str(row.check_out_date),        preferences: {
      interests: arr<string>(prefs.interests),
      notes: str(prefs.notes),
      consent: prefs.consent === true,
      updatedAt: nullableStr(prefs.updatedAt) ?? undefined,
      affiliation: mapAffiliation(prefs.affiliation),
    },
    createdAt: str(row.created_at),
  };
}

function mapConversation(row: Row): Conversation {
  return {
    id: str(row.id),
    guestSessionId: str(row.guest_session_id),
    propertyId: str(row.property_id),
    summary: nullableStr(row.summary),
    createdAt: str(row.created_at),
    lastMessageAt: str(row.last_message_at, str(row.created_at)),
  };
}

function mapMessage(row: Row): Message {
  return {
    id: str(row.id),
    conversationId: str(row.conversation_id),
    role: str(row.role) === "assistant" ? "assistant" : "user",
    content: str(row.content),
    toolEvents: arr<ToolEvent>(row.tool_events),
    createdAt: str(row.created_at),
  };
}

function mapRequest(row: Row): MaintenanceRequest {
  return {
    id: str(row.id),
    ticketCode: str(row.ticket_code),
    propertyId: str(row.property_id),
    guestSessionId: nullableStr(row.guest_session_id),
    guestName: str(row.guest_name),
    description: str(row.description),
    category: (str(row.category) || "maintenance") as MaintenanceRequest["category"],
    priority: (str(row.priority) || "normal") as MaintenanceRequest["priority"],
    status: (str(row.status) || "new") as MaintenanceStatus,
    urgencyNote: str(row.urgency_note),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

function mapNotification(row: Row): Notification {
  return {
    id: str(row.id),
    hostId: str(row.host_id),
    propertyId: nullableStr(row.property_id),
    message: str(row.message),
    type: (str(row.type) || "system") as Notification["type"],
    read: row.read === true,
    createdAt: str(row.created_at),
  };
}

function mapProfile(row: Row): Profile {
  return {
    id: str(row.id),
    email: str(row.email),
    fullName: str(row.full_name),
    role: str(row.role) === "admin" ? "admin" : "host",
    createdAt: str(row.created_at),
  };
}

function mapReservation(row: Row): Reservation {
  return {
    id: str(row.id),
    code: str(row.code),
    propertyId: str(row.property_id),
    guestSessionId: nullableStr(row.guest_session_id),
    guestName: str(row.guest_name),
    guestEmail: str(row.guest_email),
    checkInDate: str(row.check_in_date),
    checkOutDate: str(row.check_out_date),
    guests: Number(row.guests ?? 2),
    status: (str(row.status) || "upcoming") as Reservation["status"],
    source: (str(row.source) || "manual") as Reservation["source"],
    externalId: nullableStr(row.external_id),
    notes: str(row.notes),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

function mapIntegration(row: Row): HostIntegration {
  const credentials = (row.credentials ?? {}) as Row;
  return {
    id: str(row.id),
    hostId: str(row.host_id),
    provider: "airbnb",
    status: (str(row.status) || "not_connected") as HostIntegration["status"],
    mode: (str(row.mode) || "oauth") as HostIntegration["mode"],
    accountRef: str(row.account_ref),
    hasCredentials: Boolean(credentials.clientSecret),
    lastSyncAt: nullableStr(row.last_sync_at),
    lastError: str(row.last_error),
    events: arr<IntegrationEvent>(row.events),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

/** Turns PostgREST's "no such table" answers into one actionable error. */
function mapItineraryItem(row: Row): ItineraryItem {
  const slot = str(row.slot, "morning");
  return {
    id: str(row.id),
    guestSessionId: str(row.guest_session_id),
    propertyId: str(row.property_id),
    day: Number(row.day ?? 1),
    slot: (["morning", "afternoon", "evening"] as const).includes(slot as ItinerarySlot)
      ? (slot as ItinerarySlot)
      : "morning",
    title: str(row.title),
    placeId: nullableStr(row.place_id),
    notes: str(row.notes),
    done: row.done === true,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

const itinerarySlotOrder: Record<ItinerarySlot, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

function assertTable(
  error: { message?: string; code?: string } | null,
  table: string,
  migration = "supabase/migrations/2026-11-reservations-and-integrations.sql",
) {
  if (!error) return;
  const message = error.message ?? "";
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|Could not find the table/i.test(message)
  ) {
    throw new MigrationRequiredError(table, migration);
  }
  throw new Error(message || `The ${table} query failed.`);
}

export class SupabaseRepository implements Repository {
  readonly mode = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  private async one<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as T | null;
  }

  async getProperty(id: string) {
    const data = await this.one<Row>(
      this.client.from("properties").select("*").eq("id", id).maybeSingle(),
    );
    return data ? mapProperty(data) : null;
  }

  async getPrimaryProperty() {
    if (process.env.DEMO_PROPERTY_ID) {
      const pinned = await this.getProperty(process.env.DEMO_PROPERTY_ID);
      if (pinned) return pinned;
    }
    const named = await this.one<Row>(
      this.client
        .from("properties")
        .select("*")
        .eq("name", "Casa Barcelona")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    );
    if (named) return mapProperty(named);
    const first = await this.one<Row>(
      this.client
        .from("properties")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    );
    return first ? mapProperty(first) : null;
  }

  async listProperties(hostId: string) {
    const data = await this.one<Row[]>(
      this.client
        .from("properties")
        .select("*")
        .eq("host_id", hostId)
        .order("created_at", { ascending: true }),
    );
    return (data ?? []).map(mapProperty);
  }

  async listAllProperties() {
    const data = await this.one<Row[]>(
      this.client.from("properties").select("*").order("created_at", { ascending: true }),
    );
    return (data ?? []).map(mapProperty);
  }

  async createProperty(hostId: string, input: PropertyInput) {
    const data = await this.one<Row>(
      this.client
        .from("properties")
        .insert({ ...propertyColumns(input), host_id: hostId })
        .select("*")
        .single(),
    );
    if (!data) throw new Error("Could not create the property.");
    return mapProperty(data);
  }

  async updateProperty(id: string, hostId: string, patch: Partial<PropertyInput>) {
    const payload: Row = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.address !== undefined) payload.address = patch.address;
    if (patch.neighbourhood !== undefined) payload.neighbourhood = patch.neighbourhood;
    if (patch.city !== undefined) payload.city = patch.city;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.hostName !== undefined) payload.host_name = patch.hostName;
    if (patch.hostPhone !== undefined) payload.host_phone = patch.hostPhone;
    if (patch.hostEmail !== undefined) payload.host_email = patch.hostEmail;
    if (patch.checkIn !== undefined) payload.check_in = patch.checkIn;
    if (patch.checkOut !== undefined) payload.check_out = patch.checkOut;
    if (patch.checkInInstructions !== undefined)
      payload.check_in_instructions = patch.checkInInstructions;
    if (patch.checkOutInstructions !== undefined)
      payload.check_out_instructions = patch.checkOutInstructions;
    if (patch.wifiName !== undefined) payload.wifi_name = patch.wifiName;
    if (patch.wifiPassword !== undefined) payload.wifi_password = patch.wifiPassword;
    if (patch.houseRules !== undefined) payload.house_rules = patch.houseRules;
    if (patch.amenities !== undefined) payload.amenities = patch.amenities;
    if (patch.applianceInstructions !== undefined)
      payload.appliance_instructions = patch.applianceInstructions;
    if (patch.emergencyInformation !== undefined)
      payload.emergency_information = patch.emergencyInformation;
    if (patch.faqs !== undefined) payload.faqs = patch.faqs;
    if (patch.settings !== undefined) payload.settings = patch.settings;
    payload.updated_at = new Date().toISOString();

    const data = await this.one<Row>(
      this.client
        .from("properties")
        .update(payload)
        .eq("id", id)
        .eq("host_id", hostId)
        .select("*")
        .maybeSingle(),
    );
    return data ? mapProperty(data) : null;
  }

  async createGuestSession(input: CreateGuestSessionInput) {
    const preferences: GuestPreferences =
      input.preferences ?? { interests: [], notes: "", consent: false };
    const data = await this.one<Row>(
      this.client
        .from("guest_sessions")
        .insert({
          property_id: input.propertyId,
          guest_name: input.guestName,
          check_in_date: input.checkInDate,
          check_out_date: input.checkOutDate,
          preferences,
        })
        .select("*")
        .single(),
    );
    if (!data) throw new Error("Could not start a guest session.");
    return mapGuestSession(data);
  }

  async getGuestSession(id: string) {
    const data = await this.one<Row>(
      this.client.from("guest_sessions").select("*").eq("id", id).maybeSingle(),
    );
    return data ? mapGuestSession(data) : null;
  }

  async listGuestSessions(propertyIds: string[]) {
    if (!propertyIds.length) return [];
    const data = await this.one<Row[]>(
      this.client
        .from("guest_sessions")
        .select("*")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false }),
    );
    return (data ?? []).map(mapGuestSession);
  }

  async listAllGuestSessions() {
    const data = await this.one<Row[]>(
      this.client
        .from("guest_sessions")
        .select("*")
        .order("created_at", { ascending: false }),
    );
    return (data ?? []).map(mapGuestSession);
  }

  async updateGuestPreferences(id: string, preferences: GuestPreferences) {
    const data = await this.one<Row>(
      this.client
        .from("guest_sessions")
        .update({ preferences })
        .eq("id", id)
        .select("*")
        .maybeSingle(),
    );
    return data ? mapGuestSession(data) : null;
  }

  async getOrCreateConversation(guestSessionId: string, propertyId: string) {
    const existing = await this.one<Row>(
      this.client
        .from("conversations")
        .select("*")
        .eq("guest_session_id", guestSessionId)
        .maybeSingle(),
    );
    if (existing) return mapConversation(existing);

    const created = await this.client
      .from("conversations")
      .insert({ guest_session_id: guestSessionId, property_id: propertyId })
      .select("*")
      .maybeSingle();

    if (created.data) return mapConversation(created.data as Row);

    // Unique constraint race: another request created it a moment ago.
    const retry = await this.one<Row>(
      this.client
        .from("conversations")
        .select("*")
        .eq("guest_session_id", guestSessionId)
        .maybeSingle(),
    );
    if (!retry) throw new Error(created.error?.message ?? "Could not open a conversation.");
    return mapConversation(retry);
  }

  async getConversation(id: string) {
    const data = await this.one<Row>(
      this.client.from("conversations").select("*").eq("id", id).maybeSingle(),
    );
    return data ? mapConversation(data) : null;
  }

  async listConversations(propertyIds: string[]) {
    if (!propertyIds.length) return [];
    const data = await this.one<Row[]>(
      this.client
        .from("conversations")
        .select("*")
        .in("property_id", propertyIds)
        .order("last_message_at", { ascending: false }),
    );
    return (data ?? []).map(mapConversation);
  }

  async setConversationSummary(id: string, summary: string) {
    const { error } = await this.client
      .from("conversations")
      .update({ summary })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listMessages(conversationId: string, limit = 200) {
    const { data, error } = await this.client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map(mapMessage);
  }

  async addMessage(input: {
    conversationId: string;
    role: ChatRole;
    content: string;
    toolEvents?: ToolEvent[];
  }) {
    const { data, error } = await this.client
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        tool_events: input.toolEvents ?? [],
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await this.client
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", input.conversationId);
    return mapMessage(data as Row);
  }

  async createMaintenanceRequest(input: CreateRequestInput) {
    const { data, error } = await this.client
      .from("maintenance_requests")
      .insert({
        ticket_code: newTicketCode(),
        property_id: input.propertyId,
        guest_session_id: input.guestSessionId,
        guest_name: input.guestName,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "new",
        urgency_note: input.urgencyNote ?? "",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRequest(data as Row);
  }

  async listMaintenanceRequests(propertyIds: string[]) {
    if (!propertyIds.length) return [];
    const { data, error } = await this.client
      .from("maintenance_requests")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map(mapRequest);
  }

  async listMaintenanceForGuest(guestSessionId: string) {
    const { data, error } = await this.client
      .from("maintenance_requests")
      .select("*")
      .eq("guest_session_id", guestSessionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map(mapRequest);
  }

  async updateMaintenanceStatus(
    id: string,
    status: MaintenanceStatus,
    propertyIds: string[],
  ) {
    if (!propertyIds.length) return null;
    const { data, error } = await this.client
      .from("maintenance_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("property_id", propertyIds)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRequest(data as Row) : null;
  }

  async createNotification(input: {
    hostId: string;
    propertyId: string | null;
    message: string;
    type: Notification["type"];
  }) {
    const { data, error } = await this.client
      .from("notifications")
      .insert({
        host_id: input.hostId,
        property_id: input.propertyId,
        message: input.message,
        type: input.type,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapNotification(data as Row);
  }

  async listNotifications(hostId: string) {
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map(mapNotification);
  }

  async markNotificationsRead(hostId: string) {
    const { error } = await this.client
      .from("notifications")
      .update({ read: true })
      .eq("host_id", hostId);
    if (error) throw new Error(error.message);
  }

  async listReservations(propertyIds: string[]) {
    if (!propertyIds.length) return [];
    const { data, error } = await this.client
      .from("reservations")
      .select("*")
      .in("property_id", propertyIds)
      .order("check_in_date", { ascending: true });
    assertTable(error, "reservations");
    return ((data ?? []) as Row[]).map(mapReservation);
  }

  async getReservation(id: string) {
    const { data, error } = await this.client
      .from("reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    assertTable(error, "reservations");
    return data ? mapReservation(data as Row) : null;
  }

  async getReservationForGuest(guestSessionId: string) {
    const { data, error } = await this.client
      .from("reservations")
      .select("*")
      .eq("guest_session_id", guestSessionId)
      .maybeSingle();
    assertTable(error, "reservations");
    return data ? mapReservation(data as Row) : null;
  }

  async getReservationByCode(code: string) {
    const { data, error } = await this.client
      .from("reservations")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    assertTable(error, "reservations");
    return data ? mapReservation(data as Row) : null;
  }

  async listReservationsByEmail(email: string) {
    const normalized = email.trim();
    if (!normalized) return [];
    const { data, error } = await this.client
      .from("reservations")
      .select("*")
      .ilike("guest_email", normalized)
      .order("check_in_date", { ascending: false });
    assertTable(error, "reservations");
    return ((data ?? []) as Row[]).map(mapReservation);
  }

  async createReservation(hostId: string, input: CreateReservationInput) {
    const { data: property, error: propertyError } = await this.client
      .from("properties")
      .select("id")
      .eq("id", input.propertyId)
      .eq("host_id", hostId)
      .maybeSingle();
    if (propertyError) assertTable(propertyError, "properties");
    if (!property) throw new Error("That property isn't on this account.");

    const { data, error } = await this.client
      .from("reservations")
      .insert({
        code: input.code ?? newReservationCode(input.source ?? "manual"),
        property_id: input.propertyId,
        guest_session_id: input.guestSessionId ?? null,
        guest_name: input.guestName,
        guest_email: input.guestEmail ?? "",
        check_in_date: input.checkInDate,
        check_out_date: input.checkOutDate,
        guests: input.guests,
        status: input.status ?? "upcoming",
        source: input.source ?? "manual",
        external_id: input.externalId ?? null,
        notes: input.notes ?? "",
      })
      .select("*")
      .single();
    assertTable(error, "reservations");
    if (!data) throw new Error("The reservation could not be saved.");
    return mapReservation(data as Row);
  }

  async updateReservationStatus(
    id: string,
    status: Reservation["status"],
    propertyIds: string[],
  ) {
    if (!propertyIds.length) return null;
    const { data, error } = await this.client
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("property_id", propertyIds)
      .select("*")
      .maybeSingle();
    assertTable(error, "reservations");
    return data ? mapReservation(data as Row) : null;
  }

  async attachReservationToGuest(reservationId: string, guestSessionId: string) {
    const { data, error } = await this.client
      .from("reservations")
      .update({
        guest_session_id: guestSessionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .select("*")
      .maybeSingle();
    assertTable(error, "reservations");
    return data ? mapReservation(data as Row) : null;
  }

  async linkReservationToGuest(propertyId: string, guest: GuestSession) {
    const existing = await this.getReservationForGuest(guest.id);
    if (existing) return existing;

    const { data: open, error } = await this.client
      .from("reservations")
      .select("*")
      .eq("property_id", propertyId)
      .is("guest_session_id", null)
      .in("status", ["upcoming", "in_house"])
      .order("check_in_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    assertTable(error, "reservations");

    if (open) {
      const { data: updated, error: updateError } = await this.client
        .from("reservations")
        .update({
          guest_session_id: guest.id,
          guest_name: guest.guestName,
          guest_email: ((open as Row).guest_email as string) || DEMO_GUEST.email,
          check_in_date: guest.checkInDate,
          check_out_date: guest.checkOutDate,
          status: statusForDates(guest.checkInDate, guest.checkOutDate, todayISO(0)),
        })
        .eq("id", (open as Row).id as string)
        .select("*")
        .maybeSingle();
      assertTable(updateError, "reservations");
      if (updated) return mapReservation(updated as Row);
    }

    const { data: created, error: createError } = await this.client
      .from("reservations")
      .insert({
        code: newReservationCode("demo"),
        property_id: propertyId,
        guest_session_id: guest.id,
        guest_name: guest.guestName,
        guest_email: DEMO_GUEST.email,
        check_in_date: guest.checkInDate,
        check_out_date: guest.checkOutDate,
        guests: 2,
        status: statusForDates(guest.checkInDate, guest.checkOutDate, todayISO(0)),
        source: "demo",
        notes: "Created for the demo guest session.",
      })
      .select("*")
      .single();
    assertTable(createError, "reservations");
    return created ? mapReservation(created as Row) : null;
  }

  async getIntegration(hostId: string) {
    const { data, error } = await this.client
      .from("integrations")
      .select("*")
      .eq("host_id", hostId)
      .eq("provider", "airbnb")
      .maybeSingle();
    assertTable(error, "integrations");
    return data ? mapIntegration(data as Row) : null;
  }

  async saveIntegration(hostId: string, patch: IntegrationPatch) {
    const payload: Row = {
      host_id: hostId,
      provider: "airbnb",
      updated_at: new Date().toISOString(),
    };
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.mode !== undefined) payload.mode = patch.mode;
    if (patch.accountRef !== undefined) payload.account_ref = patch.accountRef;
    if (patch.lastSyncAt !== undefined) payload.last_sync_at = patch.lastSyncAt;
    if (patch.lastError !== undefined) payload.last_error = patch.lastError;
    if (patch.events !== undefined) payload.events = patch.events.slice(0, 20);
    if (patch.credentials !== undefined) payload.credentials = patch.credentials ?? {};

    const { data, error } = await this.client
      .from("integrations")
      .upsert(payload, { onConflict: "host_id,provider" })
      .select("*")
      .single();
    assertTable(error, "integrations");
    if (!data) throw new Error("The connection record could not be saved.");
    return mapIntegration(data as Row);
  }

  /* The plan lives in guest_sessions.preferences.itinerary, a jsonb column that
     already exists in every deployment. It is guest-scoped, read and written in
     one place, and needs no migration before the product works. */

  private async readGuestPreferences(guestSessionId: string): Promise<Row> {
    const { data, error } = await this.client
      .from("guest_sessions")
      .select("preferences")
      .eq("id", guestSessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return ((data?.preferences ?? {}) as Row) ?? {};
  }

  private async saveGuestPreferences(guestSessionId: string, preferences: Row) {
    const { error } = await this.client
      .from("guest_sessions")
      .update({ preferences })
      .eq("id", guestSessionId);
    if (error) throw new Error(error.message);
  }

  private static itineraryRows(preferences: Row): Row[] {
    return Array.isArray(preferences.itinerary) ? ([...preferences.itinerary] as Row[]) : [];
  }

  async listItinerary(guestSessionId: string) {
    const preferences = await this.readGuestPreferences(guestSessionId);
    return SupabaseRepository.itineraryRows(preferences)
      .map(mapItineraryItem)
      .sort(
        (a, b) =>
          a.day - b.day || itinerarySlotOrder[a.slot] - itinerarySlotOrder[b.slot],
      );
  }

  async addItineraryItem(input: CreateItineraryItemInput) {
    const preferences = await this.readGuestPreferences(input.guestSessionId);
    const rows = SupabaseRepository.itineraryRows(preferences);
    const now = new Date().toISOString();

    const row: Row = {
      id: crypto.randomUUID(),
      guest_session_id: input.guestSessionId,
      property_id: input.propertyId,
      day: input.day,
      slot: input.slot,
      title: input.title,
      place_id: input.placeId ?? null,
      notes: input.notes ?? "",
      done: false,
      created_at: now,
      updated_at: now,
    };

    rows.push(row);
    await this.saveGuestPreferences(input.guestSessionId, { ...preferences, itinerary: rows });
    return mapItineraryItem(row);
  }

  async updateItineraryItem(
    id: string,
    guestSessionId: string,
    patch: { done?: boolean; title?: string; notes?: string },
  ) {
    const preferences = await this.readGuestPreferences(guestSessionId);
    const rows = SupabaseRepository.itineraryRows(preferences);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;

    const row: Row = { ...rows[index] };
    if (patch.done !== undefined) row.done = patch.done;
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.notes !== undefined) row.notes = patch.notes;
    row.updated_at = new Date().toISOString();
    rows[index] = row;

    await this.saveGuestPreferences(guestSessionId, { ...preferences, itinerary: rows });
    return mapItineraryItem(row);
  }

  async removeItineraryItem(id: string, guestSessionId: string) {
    const preferences = await this.readGuestPreferences(guestSessionId);
    const rows = SupabaseRepository.itineraryRows(preferences);
    const next = rows.filter((row) => row.id !== id);
    if (next.length === rows.length) return false;

    await this.saveGuestPreferences(guestSessionId, { ...preferences, itinerary: next });
    return true;
  }

  async clearItinerary(guestSessionId: string) {
    const preferences = await this.readGuestPreferences(guestSessionId);
    await this.saveGuestPreferences(guestSessionId, { ...preferences, itinerary: [] });
  }

  async getProfile(id: string) {
    const data = await this.one<Row>(
      this.client.from("profiles").select("*").eq("id", id).maybeSingle(),
    );
    return data ? mapProfile(data) : null;
  }

  async getProfileByEmail(email: string) {
    const data = await this.one<Row>(
      this.client
        .from("profiles")
        .select("*")
        .ilike("email", email)
        .maybeSingle(),
    );
    return data ? mapProfile(data) : null;
  }

  async ensureProfile(input: {
    id?: string;
    email: string;
    fullName: string;
    role?: Profile["role"];
  }) {
    const existing = await this.getProfileByEmail(input.email);
    if (existing) return existing;

    const payload: Row = {
      email: input.email,
      full_name: input.fullName,
      role: input.role ?? "host",
    };
    if (input.id) payload.id = input.id;

    const { data, error } = await this.client
      .from("profiles")
      .upsert(payload, { onConflict: "email" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(data as Row);
  }
}

export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
