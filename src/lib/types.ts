/* Domain types shared by the database layer, the API routes and the UI. */

export type Priority = "urgent" | "high" | "normal" | "low";
export type MaintenanceStatus = "new" | "in_progress" | "resolved";
export type RequestCategory = "maintenance" | "assistance" | "service";
export type ChatRole = "user" | "assistant";

export type Faq = { question: string; answer: string };
export type ApplianceInstruction = { appliance: string; instructions: string };

export type ConciergeTone = "warm" | "professional" | "luxury";
export type OfferingType = "stay" | "activity" | "service";

export type PropertySettings = {
  tone: ConciergeTone;
  extraInstructions: string;
  servicePreferences: string;
  escalationInstructions: string;
  offeringType?: OfferingType;
  offeringCategory?: string;
  priceLabel?: string;
  duration?: string;
};

export type Property = {
  id: string;
  hostId: string;
  name: string;
  address: string;
  neighbourhood: string;
  city: string;
  description: string;
  hostName: string;
  hostPhone: string;
  hostEmail: string;
  checkIn: string;
  checkOut: string;
  checkInInstructions: string;
  checkOutInstructions: string;
  wifiName: string;
  wifiPassword: string;
  houseRules: string[];
  amenities: string[];
  applianceInstructions: ApplianceInstruction[];
  emergencyInformation: string;
  faqs: Faq[];
  settings: PropertySettings;
  createdAt: string;
  updatedAt: string;
};

export type PropertyInput = Omit<
  Property,
  "id" | "hostId" | "createdAt" | "updatedAt"
>;

export type AffiliationStatus = "pending" | "accepted" | "declined";

export type Affiliation = {
  id: string;
  guestUserId: string;
  guestName: string;
  guestEmail: string;
  hostId: string;
  hostName: string;
  propertyId: string;
  propertyName: string;
  status: AffiliationStatus;
  initiatedBy: "guest" | "host";
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuestPreferences = {
  interests: string[];
  notes: string;
  consent: boolean;
  updatedAt?: string;
  /* Affiliations use the existing guest_sessions record so this feature works
     on the current database without a migration. */
  affiliation?: Affiliation;
  /* Marks the workspace session of a guest account that has no booking, so it
     can be reused instead of creating a new row on every visit. */
  planningGuestUserId?: string;
};

export type GuestSession = {
  id: string;
  propertyId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  preferences: GuestPreferences;
  createdAt: string;
};

export type Conversation = {
  id: string;
  guestSessionId: string;
  propertyId: string;
  summary: string | null;
  createdAt: string;
  lastMessageAt: string;
};

export type ToolEvent = {
  name: string;
  label: string;
  status: "ok" | "error";
  detail?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  toolEvents: ToolEvent[];
  createdAt: string;
};

export type MaintenanceRequest = {
  id: string;
  ticketCode: string;
  propertyId: string;
  guestSessionId: string | null;
  guestName: string;
  description: string;
  category: RequestCategory;
  priority: Priority;
  status: MaintenanceStatus;
  urgencyNote: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  hostId: string;
  propertyId: string | null;
  message: string;
  type: "maintenance" | "message" | "service" | "system";
  read: boolean;
  createdAt: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: "host" | "admin";
  createdAt: string;
};

export type HostSession = {
  hostId: string;
  email: string;
  fullName: string;
  mode: "supabase" | "local";
};

export type GuestAccount = {
  id: string;
  email: string;
  fullName: string;
};

/* ------------------------------------------------------------- RESERVATIONS */

export type ReservationStatus = "upcoming" | "in_house" | "completed" | "cancelled";

/**
 * Where a reservation row came from.
 * `airbnb` is reserved for rows written by an authorised integration — nothing
 * in this prototype writes it, so the UI never presents demo rows as Airbnb data.
 */
export type ReservationSource = "airbnb" | "manual" | "demo";

export type Reservation = {
  id: string;
  code: string;
  propertyId: string;
  guestSessionId: string | null;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  status: ReservationStatus;
  source: ReservationSource;
  externalId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/* --------------------------------------------------------------- INTEGRATIONS */

export type IntegrationStatus =
  | "not_connected"
  | "demo"
  | "pending_verification"
  | "connected"
  | "error";

export type IntegrationMode = "oauth" | "manual" | "demo";

export type IntegrationEvent = {
  at: string;
  kind: "info" | "sync" | "error";
  message: string;
};

/** The public shape of an integration record. Credentials are never part of it. */
export type HostIntegration = {
  id: string;
  hostId: string;
  provider: "airbnb";
  status: IntegrationStatus;
  mode: IntegrationMode;
  accountRef: string;
  hasCredentials: boolean;
  lastSyncAt: string | null;
  lastError: string;
  events: IntegrationEvent[];
  createdAt: string;
  updatedAt: string;
};

export type Place = {
  id: string;
  name: string;
  category:
    | "restaurant"
    | "cafe"
    | "nightlife"
    | "culture"
    | "shopping"
    | "outdoors"
    | "market";
  neighbourhood: string;
  description: string;
  price: 1 | 2 | 3;
  tags: string[];
  distanceKm: number;
  bestTime: "morning" | "afternoon" | "evening" | "any";
  /** A plain-language subtype, e.g. Club, Bar, Lounge for nightlife. */
  subtype?: string;
};

/* ------------------------------------------------------------------ ITINERARY */

export type ItinerarySlot = "morning" | "afternoon" | "evening";

/**
 * One planned stop on a guest's stay. `day` is 1-based from check-in, and the
 * plan is scoped to a single guest session so one guest can never read or edit
 * another's itinerary.
 */
export type ItineraryItem = {
  id: string;
  guestSessionId: string;
  propertyId: string;
  day: number;
  slot: ItinerarySlot;
  title: string;
  placeId: string | null;
  notes: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};
