/* Domain types shared by the database layer, the API routes and the UI. */

export type Priority = "urgent" | "high" | "normal" | "low";
export type MaintenanceStatus = "new" | "in_progress" | "resolved";
export type RequestCategory = "maintenance" | "assistance" | "service";
export type ChatRole = "user" | "assistant";

export type Faq = { question: string; answer: string };
export type ApplianceInstruction = { appliance: string; instructions: string };

export type ConciergeTone = "warm" | "professional" | "luxury";

export type PropertySettings = {
  tone: ConciergeTone;
  extraInstructions: string;
  servicePreferences: string;
  escalationInstructions: string;
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

export type GuestPreferences = {
  interests: string[];
  notes: string;
  consent: boolean;
  updatedAt?: string;
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
};
