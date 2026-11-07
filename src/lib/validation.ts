import { z } from "zod";

export const settingsSchema = z.object({
  tone: z.enum(["warm", "professional", "luxury"]).default("warm"),
  extraInstructions: z.string().max(1500).default(""),
  servicePreferences: z.string().max(1500).default(""),
  escalationInstructions: z.string().max(1500).default(""),
  offeringType: z.enum(["stay", "activity", "service"]).optional(),
  offeringCategory: z.string().trim().max(80).optional(),
  priceLabel: z.string().trim().max(40).optional(),
  duration: z.string().trim().max(80).optional(),
});

export const propertySchema = z.object({
  name: z.string().trim().min(2, "A property name is required.").max(120),
  address: z.string().trim().min(3, "An address is required.").max(220),
  neighbourhood: z.string().trim().max(80).default(""),
  city: z.string().trim().min(2, "A city is required.").max(80),
  description: z.string().trim().max(1500).default(""),
  hostName: z.string().trim().max(80).default(""),
  hostPhone: z.string().trim().max(40).default(""),
  hostEmail: z.string().trim().max(120).default(""),
  checkIn: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time such as 15:00.")
    .default("15:00"),
  checkOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time such as 11:00.")
    .default("11:00"),
  checkInInstructions: z.string().trim().max(3000).default(""),
  checkOutInstructions: z.string().trim().max(3000).default(""),
  wifiName: z.string().trim().max(100).default(""),
  wifiPassword: z.string().trim().max(100).default(""),
  houseRules: z.array(z.string().trim().max(400)).max(30).default([]),
  amenities: z.array(z.string().trim().max(200)).max(60).default([]),
  applianceInstructions: z
    .array(
      z.object({
        appliance: z.string().trim().max(120),
        instructions: z.string().trim().max(2000),
      }),
    )
    .max(30)
    .default([]),
  emergencyInformation: z.string().trim().max(3000).default(""),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().max(300),
        answer: z.string().trim().max(2000),
      }),
    )
    .max(30)
    .default([]),
  settings: settingsSchema.optional(),
});

export const statusSchema = z.enum(["new", "in_progress", "resolved"]);

export const hostSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "That password is too long."),
  offeringName: z.string().trim().min(2, "Name your offering.").max(120),
  offeringType: z.enum(["stay", "activity", "service"]),
  offeringCategory: z.string().trim().min(2, "Choose a category.").max(80),
  city: z.string().trim().min(2, "Add a city.").max(80),
  neighbourhood: z.string().trim().max(80).default(""),
  description: z.string().trim().min(20, "Add a short description of your offering.").max(600),
  address: z.string().trim().max(220).default(""),
  priceLabel: z.string().trim().max(40).default(""),
  duration: z.string().trim().max(80).default(""),
});

export const affiliationRequestSchema = z.object({
  hostId: z.string().trim().min(1, "Choose a host.").max(120),
  propertyId: z.string().trim().min(1, "Choose an offering.").max(120),
  reservationId: z.string().trim().max(120).optional().nullable(),
});

export const affiliationStatusSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export const reservationStatusSchema = z.enum([
  "upcoming",
  "in_house",
  "completed",
  "cancelled",
]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in the form 2026-11-03.");

export const reservationSchema = z
  .object({
    propertyId: z.string().trim().min(1, "Choose a property."),
    guestName: z.string().trim().min(2, "A guest name is required.").max(80),
    guestEmail: z.string().trim().email("Enter the guest's email address.").max(160),
    checkInDate: isoDate,
    checkOutDate: isoDate,
    guests: z.coerce
      .number()
      .int("Use a whole number of guests.")
      .min(1, "At least one guest.")
      .max(30, "This prototype supports up to 30 guests."),
    notes: z.string().trim().max(600).default(""),
  })
  .refine((value) => value.checkOutDate >= value.checkInDate, {
    message: "Check-out cannot be before check-in.",
    path: ["checkOutDate"],
  });

export const integrationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save_credentials"),
    clientId: z.string().trim().min(4, "Enter the client ID from your partner account.").max(200),
    clientSecret: z
      .string()
      .trim()
      .min(8, "Enter the client secret from your partner account.")
      .max(400),
    accountRef: z.string().trim().max(120).default(""),
  }),
  z.object({ action: z.literal("demo") }),
  z.object({ action: z.literal("sync") }),
  z.object({ action: z.literal("disconnect") }),
]);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(4, "Enter your password.").max(200),
});

export const guestLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter the email address from your booking.")
    .max(160),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter the surname on your booking.")
    .max(80),
});

export const guestAccountSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "That password is too long."),
});

export const guestAccountLoginSchema = z.object({
  email: z.string().trim().email("Enter your email address.").max(160),
  password: z.string().min(1, "Enter your password.").max(200),
});
