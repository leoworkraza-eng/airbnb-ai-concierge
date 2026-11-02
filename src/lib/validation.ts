import { z } from "zod";

export const settingsSchema = z.object({
  tone: z.enum(["warm", "professional", "luxury"]).default("warm"),
  extraInstructions: z.string().max(1500).default(""),
  servicePreferences: z.string().max(1500).default(""),
  escalationInstructions: z.string().max(1500).default(""),
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

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(4, "Enter your password.").max(200),
});
