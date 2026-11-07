import type { OfferingType, Property, PropertyInput } from "./types";

export const OFFERING_TYPES: OfferingType[] = ["stay", "activity", "service"];

export const offeringTypeLabels: Record<OfferingType, string> = {
  stay: "Stay",
  activity: "Activity",
  service: "Service",
};

export const offeringTypeNotes: Record<OfferingType, string> = {
  stay: "A home, room or studio guests can book.",
  activity: "A tour, night out, class or local experience.",
  service: "A useful service such as a chef, transfer or welcome.",
};

export const offeringCategories: Record<OfferingType, string[]> = {
  stay: ["Apartment", "House", "Room", "Studio", "Villa"],
  activity: [
    "Food & drink",
    "Nightlife",
    "Culture",
    "Outdoors",
    "Wellness",
    "Tour",
  ],
  service: ["Concierge", "Cleaning", "Chef", "Transport", "Photography"],
};

export type OfferingInput = {
  name: string;
  type: OfferingType;
  category: string;
  city: string;
  neighbourhood?: string;
  description: string;
  address?: string;
  hostName: string;
  hostEmail: string;
  priceLabel?: string;
  duration?: string;
};

export function offeringMeta(property: Property) {
  const type = property.settings.offeringType ?? "stay";
  return {
    type,
    typeLabel: offeringTypeLabels[type],
    category:
      property.settings.offeringCategory ||
      (type === "stay" ? "Apartment" : type === "activity" ? "Activity" : "Service"),
    priceLabel: property.settings.priceLabel ?? "",
    duration: property.settings.duration ?? "",
  };
}

export function buildOfferingInput(input: OfferingInput): PropertyInput {
  return {
    name: input.name,
    address:
      input.address?.trim() ||
      [input.neighbourhood, input.city].filter(Boolean).join(", "),
    neighbourhood: input.neighbourhood?.trim() || "",
    city: input.city,
    description: input.description,
    hostName: input.hostName,
    hostPhone: "",
    hostEmail: input.hostEmail,
    checkIn: "15:00",
    checkOut: "11:00",
    checkInInstructions:
      input.type === "stay"
        ? ""
        : "Contact the host through your connection for arrival details.",
    checkOutInstructions: "",
    wifiName: "",
    wifiPassword: "",
    houseRules: [],
    amenities: [],
    applianceInstructions: [],
    emergencyInformation: "",
    faqs: [],
    settings: {
      tone: "warm",
      extraInstructions: "",
      servicePreferences: "",
      escalationInstructions: "",
      offeringType: input.type,
      offeringCategory: input.category,
      priceLabel: input.priceLabel?.trim() || "",
      duration: input.duration?.trim() || "",
    },
  };
}
