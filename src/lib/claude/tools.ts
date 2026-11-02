import type { Repository } from "../data/repo";
import { searchPlaces } from "../places";
import type {
  GuestSession,
  MaintenanceRequest,
  Priority,
  Property,
  RequestCategory,
  ToolEvent,
} from "../types";

/* ---------------------------------------------------------------------------
   Claude tool definitions and their real backend implementations.

   Every handler below performs a genuine database write or read through the
   repository. Nothing returns a simulated success.
   --------------------------------------------------------------------------- */

export type ToolContext = {
  repo: Repository;
  property: Property;
  guest: GuestSession;
  conversationId: string;
};

export const toolDefinitions = [
  {
    name: "get_property_information",
    description:
      "Read the verified property record for this stay. Always call this before answering any question about Wi-Fi, access, check-in/check-out, appliances, amenities, house rules, emergency procedures, FAQs or host contact details. Returns only what the host has stored.",
    input_schema: {
      type: "object" as const,
      properties: {
        section: {
          type: "string",
          enum: [
            "overview",
            "access",
            "wifi",
            "house_rules",
            "amenities",
            "appliances",
            "emergency",
            "faqs",
            "host_contact",
            "all",
          ],
          description: "Which part of the property record to retrieve.",
        },
      },
      required: ["section"],
    },
  },
  {
    name: "create_maintenance_request",
    description:
      "File a real maintenance or assistance ticket for this property. The ticket appears immediately in the host dashboard. Call only after you understand the issue and the guest has explicitly agreed to submit it.",
    input_schema: {
      type: "object" as const,
      properties: {
        description: {
          type: "string",
          description:
            "A clear, specific description of the problem or request, in the guest's own terms plus the facts you clarified.",
        },
        category: {
          type: "string",
          enum: ["maintenance", "assistance", "service"],
          description:
            "maintenance for a fault, assistance for a human decision, service for an extra service request.",
        },
        priority: {
          type: "string",
          enum: ["urgent", "high", "normal", "low"],
          description:
            "urgent = safety risk or unusable essential (no water, no power, gas, leak, lockout). high = significantly disrupts the stay. normal = inconvenient but liveable. low = question or nice-to-have.",
        },
        urgency_note: {
          type: "string",
          description:
            "One short line on why this priority was chosen, e.g. 'No hot water before a 07:00 flight'.",
        },
        guest_confirmed: {
          type: "boolean",
          description:
            "True only if the guest explicitly agreed in their latest message to submitting this request.",
        },
      },
      required: ["description", "category", "priority", "guest_confirmed"],
    },
  },
  {
    name: "save_guest_preferences",
    description:
      "Save guest preferences so future recommendations are personalised. Ask the guest for permission first and only pass consented=true when they agreed.",
    input_schema: {
      type: "object" as const,
      properties: {
        interests: {
          type: "array",
          items: { type: "string" },
          description:
            "Short interest tags, e.g. 'nightlife', 'italian food', 'architecture', 'budget-friendly', 'quiet mornings'.",
        },
        notes: {
          type: "string",
          description:
            "A brief service note, e.g. 'Prefers late dinners and walking distance'. Never include sensitive personal data.",
        },
        consented: {
          type: "boolean",
          description: "True only when the guest has agreed to have this remembered.",
        },
      },
      required: ["interests", "consented"],
    },
  },
  {
    name: "notify_host",
    description:
      "Create a notification for the host in the dashboard. Use for requests needing a human decision, urgent issues, or when the guest asks to contact the host.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "A concise notification for the host, including the guest's name.",
        },
        urgent: {
          type: "boolean",
          description: "True if the host should look at this immediately.",
        },
      },
      required: ["message", "urgent"],
    },
  },
  {
    name: "search_local_recommendations",
    description:
      "Search the Barcelona guide for restaurants, cafés, nightlife, culture, shopping, markets and outdoors. Rank results using the guest's preferences, budget, time of day and distance.",
    input_schema: {
      type: "object" as const,
      properties: {
        interests: {
          type: "array",
          items: { type: "string" },
          description: "Free-text interests, e.g. ['nightlife', 'italian', 'cheap eats'].",
        },
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "restaurant",
              "cafe",
              "nightlife",
              "culture",
              "shopping",
              "outdoors",
              "market",
            ],
          },
        },
        budget: { type: "string", enum: ["low", "mid", "high"] },
        time_of_day: {
          type: "string",
          enum: ["morning", "afternoon", "evening"],
        },
        max_distance_km: { type: "number" },
        limit: { type: "number" },
        neighbourhood: { type: "string" },
      },
      required: [],
    },
  },
] as const;

export const toolLabels: Record<string, string> = {
  get_property_information: "Read the property record",
  create_maintenance_request: "Filed a maintenance ticket",
  save_guest_preferences: "Saved guest preferences",
  notify_host: "Notified the host",
  search_local_recommendations: "Searched the Barcelona guide",
};

type ToolResult = { result: Record<string, unknown>; event: ToolEvent; ticket?: MaintenanceRequest };

function fail(name: string, message: string): ToolResult {
  return {
    result: { ok: false, error: message },
    event: {
      name,
      label: toolLabels[name] ?? name,
      status: "error",
      detail: message,
    },
  };
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const { repo, property, guest } = ctx;

  try {
    switch (name) {
      case "get_property_information": {
        const section = String(input.section ?? "all");
        const sections: Record<string, unknown> = {
          overview: {
            name: property.name,
            description: property.description,
            address: property.address,
            neighbourhood: property.neighbourhood,
            city: property.city,
            checkIn: property.checkIn,
            checkOut: property.checkOut,
            guest: {
              name: guest.guestName,
              checkInDate: guest.checkInDate,
              checkOutDate: guest.checkOutDate,
            },
          },
          access: {
            checkInInstructions: property.checkInInstructions,
            checkOutInstructions: property.checkOutInstructions,
            checkIn: property.checkIn,
            checkOut: property.checkOut,
          },
          wifi: { network: property.wifiName, password: property.wifiPassword },
          house_rules: property.houseRules,
          amenities: property.amenities,
          appliances: property.applianceInstructions,
          emergency: property.emergencyInformation,
          faqs: property.faqs,
          host_contact: {
            hostName: property.hostName,
            phone: property.hostPhone,
            email: property.hostEmail,
          },
        };

        const data =
          section === "all"
            ? sections
            : sections[section] ?? null;

        if (data === null) {
          return fail(name, `No property record section named "${section}".`);
        }

        return {
          result: {
            ok: true,
            property: property.name,
            section,
            data,
            source: "verified_property_record",
            note: "This is the host-maintained record. Do not add details that are not present.",
          },
          event: {
            name,
            label: `Read the property record (${section.replace("_", " ")})`,
            status: "ok",
          },
        };
      }

      case "create_maintenance_request": {
        if (input.guest_confirmed !== true) {
          return fail(
            name,
            "The guest has not confirmed yet. Summarise the issue and ask for explicit permission before submitting.",
          );
        }

        const description = String(input.description ?? "").trim();
        if (description.length < 10) {
          return fail(name, "The description is too short to send to the host. Ask one more question.");
        }

        const priority = (["urgent", "high", "normal", "low"] as const).includes(
          input.priority as Priority,
        )
          ? (input.priority as Priority)
          : "normal";
        const category = (["maintenance", "assistance", "service"] as const).includes(
          input.category as RequestCategory,
        )
          ? (input.category as RequestCategory)
          : "maintenance";

        const request = await repo.createMaintenanceRequest({
          propertyId: property.id,
          guestSessionId: guest.id,
          guestName: guest.guestName,
          description: description.slice(0, 2000),
          category,
          priority,
          urgencyNote: String(input.urgency_note ?? "").slice(0, 300),
        });

        await repo.createNotification({
          hostId: property.hostId,
          propertyId: property.id,
          message: `${guest.guestName} reported: ${description.slice(0, 140)} (${request.ticketCode}, ${priority}).`,
          type: priority === "urgent" || priority === "high" ? "maintenance" : "service",
        });

        return {
          result: {
            ok: true,
            ticket: {
              code: request.ticketCode,
              status: request.status,
              priority: request.priority,
              category: request.category,
              description: request.description,
              createdAt: request.createdAt,
            },
            note: "Stored in the host dashboard. Confirm the ticket code to the guest; do not promise a repair time.",
          },
          event: {
            name,
            label: `Maintenance ticket ${request.ticketCode} created`,
            status: "ok",
            detail: `${priority} · ${category}`,
          },
          ticket: request,
        };
      }

      case "save_guest_preferences": {
        if (input.consented !== true) {
          return fail(
            name,
            "The guest has not agreed to this being saved. Ask for permission first.",
          );
        }

        const interests = Array.isArray(input.interests)
          ? input.interests
              .map((value) => String(value).trim().slice(0, 40))
              .filter(Boolean)
              .slice(0, 8)
          : [];
        const notes = String(input.notes ?? "").trim().slice(0, 300);

        const merged = Array.from(
          new Set([...guest.preferences.interests, ...interests]),
        ).slice(0, 10);

        await repo.updateGuestPreferences(guest.id, {
          interests: merged,
          notes: notes || guest.preferences.notes,
          consent: true,
          updatedAt: new Date().toISOString(),
        });

        return {
          result: {
            ok: true,
            saved: { interests: merged, notes: notes || guest.preferences.notes },
            note: "Preferences are stored for the rest of this stay and will guide future recommendations.",
          },
          event: {
            name,
            label: "Saved guest preferences",
            status: "ok",
            detail: merged.join(", ").slice(0, 80),
          },
        };
      }

      case "notify_host": {
        const message = String(input.message ?? "").trim();
        if (!message) return fail(name, "A notification message is required.");

        await repo.createNotification({
          hostId: property.hostId,
          propertyId: property.id,
          message: message.slice(0, 500),
          type: input.urgent === true ? "maintenance" : "message",
        });

        return {
          result: {
            ok: true,
            delivered: true,
            note: "The host will see this in their dashboard.",
          },
          event: {
            name,
            label: input.urgent === true ? "Notified the host (urgent)" : "Notified the host",
            status: "ok",
          },
        };
      }

      case "search_local_recommendations": {
        const { items, source, note } = await searchPlaces({
          interests: Array.isArray(input.interests)
            ? input.interests.map(String)
            : guest.preferences.interests,
          categories: Array.isArray(input.categories)
            ? input.categories.map(String)
            : [],
          budget: ["low", "mid", "high"].includes(String(input.budget))
            ? (input.budget as "low" | "mid" | "high")
            : undefined,
          timeOfDay: ["morning", "afternoon", "evening"].includes(
            String(input.time_of_day),
          )
            ? (input.time_of_day as "morning" | "afternoon" | "evening")
            : undefined,
          maxDistanceKm:
            typeof input.max_distance_km === "number"
              ? input.max_distance_km
              : undefined,
          limit: typeof input.limit === "number" ? input.limit : 4,
          neighbourhood:
            typeof input.neighbourhood === "string" ? input.neighbourhood : undefined,
        });

        return {
          result: {
            ok: true,
            source,
            items,
            note,
            guide: "Never state opening hours or prices as live facts. Mention confirming details before visiting.",
          },
          event: {
            name,
            label: "Searched the Barcelona guide",
            status: "ok",
            detail: `${items.length} result${items.length === 1 ? "" : "s"} · ${
              source === "google_places" ? "live Google Places" : "curated demo dataset"
            }`,
          },
        };
      }

      default:
        return fail(name, `Unknown tool "${name}".`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The backend operation failed.";
    return fail(name, `The action could not be completed: ${message}`);
  }
}

