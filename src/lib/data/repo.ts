import type {
  ChatRole,
  Conversation,
  GuestPreferences,
  GuestSession,
  HostIntegration,
  IntegrationEvent,
  IntegrationMode,
  ItineraryItem,
  ItinerarySlot,
  MaintenanceRequest,
  MaintenanceStatus,
  Message,
  Notification,
  Priority,
  Profile,
  Property,
  PropertyInput,
  RequestCategory,
  Reservation,
  ReservationSource,
  ReservationStatus,
  ToolEvent,
} from "../types";

export type RepoMode = "supabase" | "local";

/**
 * Thrown when the database is reachable but the reservation/integration tables
 * have not been created yet. The UI turns this into an actionable notice
 * instead of a stack trace.
 */
export class MigrationRequiredError extends Error {
  constructor(
    readonly table: string,
    readonly file = "supabase/migrations/2026-11-reservations-and-integrations.sql",
  ) {
    super(
      `The "${table}" table is missing. Run ${file} in the Supabase SQL editor, then reload this page.`,
    );
    this.name = "MigrationRequiredError";
  }
}

export type CreateRequestInput = {
  propertyId: string;
  guestSessionId: string | null;
  guestName: string;
  description: string;
  category: RequestCategory;
  priority: Priority;
  urgencyNote?: string;
};

export type CreateGuestSessionInput = {
  propertyId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  preferences?: GuestPreferences;
};

export type CreateReservationInput = {
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  status?: ReservationStatus;
  source?: ReservationSource;
  notes?: string;
  externalId?: string | null;
  code?: string;
  guestSessionId?: string | null;
};

export type CreateItineraryItemInput = {
  guestSessionId: string;
  propertyId: string;
  day: number;
  slot: ItinerarySlot;
  title: string;
  placeId?: string | null;
  notes?: string;
};

export type IntegrationPatch = {
  status?: HostIntegration["status"];
  mode?: IntegrationMode;
  accountRef?: string;
  lastSyncAt?: string | null;
  lastError?: string;
  events?: IntegrationEvent[];
  credentials?: { clientId: string; clientSecret: string } | null;
};

/**
 * The single data-access contract used by every route and page.
 *
 * Two implementations exist:
 *  - `SupabaseRepository` (production): RLS-scoped client for host reads/writes,
 *    service-role client for guest/AI server flows.
 *  - `LocalRepository` (development): a persistent JSON store so the product
 *    runs end-to-end before database credentials are configured. The UI labels
 *    this mode explicitly; it is never presented as Supabase data.
 */
export interface Repository {
  readonly mode: RepoMode;

  getProperty(id: string): Promise<Property | null>;
  getPrimaryProperty(): Promise<Property | null>;
  listProperties(hostId: string): Promise<Property[]>;
  /** Every public offering, used by the host directory. Server-side only. */
  listAllProperties(): Promise<Property[]>;
  createProperty(hostId: string, input: PropertyInput): Promise<Property>;
  updateProperty(
    id: string,
    hostId: string,
    patch: Partial<PropertyInput>,
  ): Promise<Property | null>;

  createGuestSession(input: CreateGuestSessionInput): Promise<GuestSession>;
  getGuestSession(id: string): Promise<GuestSession | null>;
  listGuestSessions(propertyIds: string[]): Promise<GuestSession[]>;
  /** All stay/affiliation records, used only to resolve a guest's own links. */
  listAllGuestSessions(): Promise<GuestSession[]>;
  updateGuestPreferences(
    id: string,
    preferences: GuestPreferences,
  ): Promise<GuestSession | null>;

  getOrCreateConversation(
    guestSessionId: string,
    propertyId: string,
  ): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversations(propertyIds: string[]): Promise<Conversation[]>;
  setConversationSummary(id: string, summary: string): Promise<void>;
  listMessages(conversationId: string, limit?: number): Promise<Message[]>;
  addMessage(input: {
    conversationId: string;
    role: ChatRole;
    content: string;
    toolEvents?: ToolEvent[];
  }): Promise<Message>;

  createMaintenanceRequest(input: CreateRequestInput): Promise<MaintenanceRequest>;
  listMaintenanceRequests(propertyIds: string[]): Promise<MaintenanceRequest[]>;
  listMaintenanceForGuest(guestSessionId: string): Promise<MaintenanceRequest[]>;
  updateMaintenanceStatus(
    id: string,
    status: MaintenanceStatus,
    propertyIds: string[],
  ): Promise<MaintenanceRequest | null>;

  createNotification(input: {
    hostId: string;
    propertyId: string | null;
    message: string;
    type: Notification["type"];
  }): Promise<Notification>;
  listNotifications(hostId: string): Promise<Notification[]>;
  markNotificationsRead(hostId: string): Promise<void>;

  /* Reservations ----------------------------------------------------------- */
  listReservations(propertyIds: string[]): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;
  getReservationForGuest(guestSessionId: string): Promise<Reservation | null>;
  getReservationByCode(code: string): Promise<Reservation | null>;
  /** Every stay booked with this email, across properties. */
  listReservationsByEmail(email: string): Promise<Reservation[]>;
  createReservation(
    hostId: string,
    input: CreateReservationInput,
  ): Promise<Reservation>;
  updateReservationStatus(
    id: string,
    status: ReservationStatus,
    propertyIds: string[],
  ): Promise<Reservation | null>;
  /** Attach the next open reservation to a new guest session, or create a demo one. */
  linkReservationToGuest(
    propertyId: string,
    guest: GuestSession,
  ): Promise<Reservation | null>;
  /** Attach a known reservation to a guest session created during sign-in. */
  attachReservationToGuest(
    reservationId: string,
    guestSessionId: string,
  ): Promise<Reservation | null>;

  /* Itinerary --------------------------------------------------------------- */
  listItinerary(guestSessionId: string): Promise<ItineraryItem[]>;
  addItineraryItem(input: CreateItineraryItemInput): Promise<ItineraryItem>;
  updateItineraryItem(
    id: string,
    guestSessionId: string,
    patch: { done?: boolean; title?: string; notes?: string },
  ): Promise<ItineraryItem | null>;
  removeItineraryItem(id: string, guestSessionId: string): Promise<boolean>;
  clearItinerary(guestSessionId: string): Promise<void>;

  /* External integrations --------------------------------------------------- */
  getIntegration(hostId: string): Promise<HostIntegration | null>;
  saveIntegration(
    hostId: string,
    patch: IntegrationPatch,
  ): Promise<HostIntegration>;

  getProfile(id: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  ensureProfile(input: {
    id?: string;
    email: string;
    fullName: string;
    role?: Profile["role"];
  }): Promise<Profile>;
}

export function newTicketCode() {
  return `MT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
