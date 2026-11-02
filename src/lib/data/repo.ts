import type {
  ChatRole,
  Conversation,
  GuestPreferences,
  GuestSession,
  MaintenanceRequest,
  MaintenanceStatus,
  Message,
  Notification,
  Priority,
  Profile,
  Property,
  PropertyInput,
  RequestCategory,
  ToolEvent,
} from "../types";

export type RepoMode = "supabase" | "local";

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
  createProperty(hostId: string, input: PropertyInput): Promise<Property>;
  updateProperty(
    id: string,
    hostId: string,
    patch: Partial<PropertyInput>,
  ): Promise<Property | null>;

  createGuestSession(input: CreateGuestSessionInput): Promise<GuestSession>;
  getGuestSession(id: string): Promise<GuestSession | null>;
  listGuestSessions(propertyIds: string[]): Promise<GuestSession[]>;
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
