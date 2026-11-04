import type { TurnResult } from "../ai/shared";
import type { Repository } from "../data/repo";
import { MigrationRequiredError } from "../data/repo";
import type {
  GuestSession,
  ItineraryItem,
  MaintenanceRequest,
  Message,
  Priority,
  Property,
  RequestCategory,
  ToolEvent,
} from "../types";
import { executeTool } from "../claude/tools";
import { formatItinerary, planStay, stayDayCount } from "../itinerary";

/* ---------------------------------------------------------------------------
   Guided mode.

   A deterministic concierge used when no tool-calling model is configured.
   It is not a language model and does not pretend to be one: every sentence it
   produces is assembled from the host's own record, the curated Barcelona guide
   or the real ticket it just wrote. Anything outside that is answered with an
   honest "that isn't in the record" plus the host's number.

   The same tools as the model path are used, so reads, tickets, notifications
   and preferences land in exactly the same tables.
   --------------------------------------------------------------------------- */

type Ctx = {
  repo: Repository;
  property: Property;
  guest: GuestSession;
  conversationId: string;
};

const clean = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const patternCache = new Map<string, RegExp>();

function boundary(needle: string) {
  let pattern = patternCache.get(needle);
  if (!pattern) {
    // Whole-word matching: "heating" must not match the guide keyword "eat".
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`);
    patternCache.set(needle, pattern);
  }
  return pattern;
}

function contains(text: string, needles: string[]) {
  return needles.some((needle) => boundary(needle).test(text));
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sentence(value: string, max = 200) {
  const flat = value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  if (!flat) return "";
  const clipped = flat.length > max ? `${flat.slice(0, max - 1).trim()}…` : flat;
  return titleCase(clipped);
}

const FAULT_WORDS = [
  "not working",
  "isn't working",
  "is not working",
  "doesn't work",
  "does not work",
  "stopped working",
  "won't turn",
  "will not turn",
  "won't start",
  "broken",
  "broke",
  "no hot water",
  "no water",
  "no power",
  "no electricity",
  "power cut",
  "leak",
  "leaking",
  "dripping",
  "blocked",
  "clogged",
  "stuck",
  "jam",
  "fault",
  "error",
  "smell",
  "not heating",
  "no heat",
  "too cold",
  "freezing",
  "slow",
  "locked out",
  "can't get in",
  "cannot get in",
  "key doesn't",
];

const FAULT_NOUNS = [
  "heating",
  "radiator",
  "boiler",
  "hot water",
  "water",
  "wifi",
  "wi-fi",
  "internet",
  "lock",
  "door",
  "key",
  "lockbox",
  "oven",
  "hob",
  "washing machine",
  "washer",
  "dryer",
  "fridge",
  "freezer",
  "dishwasher",
  "toilet",
  "shower",
  "bath",
  "sink",
  "drain",
  "light",
  "lamp",
  "socket",
  "plug",
  "window",
  "shutter",
  "air conditioning",
  "ac",
  "tv",
  "television",
  "coffee",
  "nespresso",
  "lift",
  "elevator",
  "noise",
  "neighbour",
  "neighbor",
  "terrace",
  "rooftop",
];

const URGENT_WORDS = [
  "gas",
  "smoke",
  "fire",
  "flood",
  "flooding",
  "burst",
  "sewage",
  "no water",
  "no power",
  "electricity",
  "locked out",
  "can't get in",
  "cannot get in",
  "emergency",
];

const HIGH_WORDS = [
  "heating",
  "radiator",
  "boiler",
  "hot water",
  "no heat",
  "wifi",
  "wi-fi",
  "internet",
  "lock",
  "door",
  "key",
  "fridge",
  "freezer",
  "toilet",
  "shower",
  "leak",
  "water",
];

const LOW_WORDS = [
  "light",
  "lamp",
  "bulb",
  "remote",
  "tv",
  "television",
  "towel",
  "pillow",
  "blanket",
  "cot",
  "hair dryer",
  "hairdryer",
  "iron",
];

const SERVICE_WORDS = [
  "late check",
  "late check-out",
  "late checkout",
  "early check",
  "luggage",
  "suitcase",
  "bags",
  "clean",
  "cleaning",
  "towel",
  "extra",
  "taxi",
  "transfer",
  "cot",
  "high chair",
];

function priorityFor(text: string): Priority {
  if (contains(text, URGENT_WORDS)) return "urgent";
  if (contains(text, HIGH_WORDS)) return "high";
  if (contains(text, LOW_WORDS)) return "low";
  return "normal";
}

function categoryFor(text: string): RequestCategory {
  if (contains(text, ["host", "marta", "permission", "ask", "decision", "refund"])) {
    return "assistance";
  }
  if (contains(text, SERVICE_WORDS)) return "service";
  return "maintenance";
}

async function readSection(ctx: Ctx, section: string) {
  return executeTool("get_property_information", { section }, ctx);
}

function lastAssistant(history: Message[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].role === "assistant") return history[index];
  }
  return null;
}

function previousUserMessage(history: Message[], excluding: string) {
  let seenCurrent = false;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    if (message.role !== "user") continue;
    if (!seenCurrent && message.content === excluding) {
      seenCurrent = true;
      continue;
    }
    return message;
  }
  return null;
}

const asksForTicket = (message: Message | null) =>
  Boolean(message && /shall i file it\?/i.test(message.content));

const asksForPreferences = (message: Message | null) =>
  Boolean(message && /shall i remember/i.test(message.content));

function affirmative(text: string) {
  if (/^(no|nope|not now|don't|cancel|stop)\b/.test(text)) return false;
  return (
    /^(y|ya|yes|yeah|yep|sure|ok|okay|please|go ahead|do it|file it|send it|submit it|confirm|correct|that'?s right|perfect|thanks,? yes)\b/.test(
      text,
    ) || /\b(yes|please do|go ahead|file it|send it|submit it|that'?s right|sounds good)\b/.test(text)
  );
}

function ticketDraftFrom(message: Message | null) {
  if (!message) return null;
  const summary = message.content.match(/send it as:\s*"([^"]+)"/i);
  const priority = message.content.match(/\((urgent|high|normal|low) priority/i);
  const category = message.content.match(/(maintenance|assistance|service)\)/i);
  if (!summary) return null;
  return {
    description: summary[1].trim(),
    priority: (priority?.[1].toLowerCase() ?? "normal") as Priority,
    category: (category?.[1].toLowerCase() ?? "maintenance") as RequestCategory,
  };
}

function interestsFrom(text: string) {
  const match = text.match(
    /(?:i (?:really )?(?:like|love|enjoy|prefer)|i'?m (?:into|interested in)|we (?:like|love|enjoy)|interested in)\s+(.+)/i,
  );
  if (!match) return [];
  // Stop at the end of the clause so "...and nightlife. Personalize my
  // recommendations." does not become one over-long interest.
  const body = match[1].split(/\.(\s|$)/)[0];
  return body
    .replace(/\b(and|plus|also)\b/gi, ",")
    .split(/[,;]/)
    .map((piece) =>
      piece
        .replace(/^(the|a|an|some|really|very|quite)\s+/i, "")
        .replace(/\b(please|thanks|thank you)\b/gi, "")
        .trim()
        .slice(0, 40),
    )
    .filter((piece) => piece.length > 1 && piece.length < 40)
    .slice(0, 6);
}

function categoriesFor(text: string): string[] {
  const categories: string[] = [];
  if (contains(text, ["restaurant", "eat", "food", "dinner", "lunch", "tapas", "paella"]))
    categories.push("restaurant");
  if (contains(text, ["cafe", "coffee", "breakfast", "pastry", "bakery"])) categories.push("cafe");
  if (contains(text, ["bar", "drink", "cocktail", "nightlife", "club", "music"]))
    categories.push("nightlife");
  if (contains(text, ["museum", "art", "gaudi", "sagrada", "culture", "gallery", "history"]))
    categories.push("culture");
  if (contains(text, ["shop", "shopping", "boutique", "design"])) categories.push("shopping");
  if (contains(text, ["market", "boqueria", "mercado"])) categories.push("market");
  if (contains(text, ["park", "beach", "walk", "outdoor", "view", "hike", "montjuic"]))
    categories.push("outdoors");
  return categories;
}

function timeOfDayFor(text: string): "morning" | "afternoon" | "evening" | undefined {
  if (contains(text, ["morning", "breakfast", "early"])) return "morning";
  if (contains(text, ["afternoon", "lunch", "midday"])) return "afternoon";
  if (contains(text, ["tonight", "evening", "dinner", "night", "drinks"])) return "evening";
  return undefined;
}

function budgetFor(text: string): "low" | "mid" | "high" | undefined {
  if (contains(text, ["cheap", "budget", "affordable", "low cost", "inexpensive"])) return "low";
  if (contains(text, ["splurge", "michelin", "fine dining", "expensive", "treat"])) return "high";
  if (contains(text, ["mid", "moderate", "reasonable"])) return "mid";
  return undefined;
}

function applianceFor(property: Property, text: string) {
  const synonyms: Record<string, string[]> = {
    "washing machine": ["wash", "washer", "laundry", "dryer"],
    "air conditioning": ["air con", "ac", "cooling", "climate"],
    "nespresso machine": ["coffee", "nespresso", "espresso", "capsule"],
    "oven and hob": ["oven", "hob", "induction", "stove", "cook"],
    dishwasher: ["dishwasher", "dishes", "plates"],
    "smart tv": ["tv", "television", "netflix", "remote"],
    "hair dryer": ["hair dryer", "hairdryer"],
  };

  for (const entry of property.applianceInstructions) {
    const name = clean(entry.appliance);
    // Word boundaries, not substrings: "activities" must never match "AC".
    if (contains(text, [name])) return entry;
    const extra = synonyms[name] ?? [];
    if (contains(text, extra)) return entry;
  }
  return null;
}

function faqFor(property: Property, text: string) {
  const words = clean(text)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  let best: { faq: Property["faqs"][number]; score: number } | null = null;

  for (const faq of property.faqs) {
    const haystack = clean(`${faq.question} ${faq.answer}`);
    const score = words.reduce((total, word) => (haystack.includes(word) ? total + 1 : total), 0);
    if (score >= 2 && (!best || score > best.score)) best = { faq, score };
  }

  return best?.faq ?? null;
}

function formatRecommendations(
  items: Array<{
    name: string;
    category: string;
    neighbourhood: string;
    description: string;
    price: string;
    distanceKm?: number;
    address?: string;
  }>,
  source: string,
) {
  const lines = items.map((item, index) => {
    const meta = [item.category, item.neighbourhood, item.price].filter(Boolean).join(" · ");
    const distance =
      typeof item.distanceKm === "number" ? ` · ${item.distanceKm.toFixed(1)} km away` : "";
    return `${index + 1}. ${item.name} — ${meta}${distance}\n   ${item.description}`;
  });

  const origin =
    source === "google_places"
      ? "These come from Google Places, live."
      : "These come from the curated Barcelona guide that ships with this demo, so please confirm hours and prices before you go.";

  return `${origin}\n\n${lines.join("\n\n")}`;
}

export async function runGuidedTurn(ctx: Ctx): Promise<TurnResult> {
  const history = await ctx.repo.listMessages(ctx.conversationId, 40);
  const lastUser = [...history].reverse().find((message) => message.role === "user");
  if (!lastUser) {
    return {
      reply: "I didn't catch that — could you write it again?",
      toolEvents: [],
      ticket: null,
    };
  }

  return respond(lastUser.content, history, ctx);
}

async function respond(rawInput: string, history: Message[], ctx: Ctx): Promise<TurnResult> {
  const { property, guest } = ctx;
  const text = clean(rawInput);
  const events: ToolEvent[] = [];
  const previousAssistant = lastAssistant(history);
  const name = guest.guestName;

  /* ------------------------------------------------------------ 1. Emergency */
  if (
    contains(text, [
      "emergency",
      "fire",
      "smoke",
      "gas",
      "flood",
      "ambulance",
      "police",
      "hurt",
      "injured",
      "injury",
      "bleeding",
      "chest pain",
    ])
  ) {
    const read = await readSection(ctx, "emergency");
    events.push(read.event);

    await executeTool(
      "notify_host",
      {
        message: `${name} reported a possible emergency through the concierge: "${sentence(rawInput, 160)}". Please check immediately.`,
        urgent: true,
      },
      ctx,
    );
    events.push({
      name: "notify_host",
      label: "Alerted the host (urgent)",
      status: "ok",
    });

    return {
      reply: [
        `Please call 112 now — that is the emergency number in Spain, and they answer in English.`,
        ``,
        `${property.emergencyInformation}`,
        ``,
        `I have also alerted ${property.hostName} in the host dashboard. I can file a maintenance ticket afterwards if it turns out to be something smaller.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* ------------------------------------------- 2. Finishing a confirmation */
  if (asksForTicket(previousAssistant)) {
    const draft = ticketDraftFrom(previousAssistant);

    if (affirmative(text) && draft) {
      const outcome = await executeTool(
        "create_maintenance_request",
        {
          description: draft.description,
          category: draft.category,
          priority: draft.priority,
          urgency_note: `Reported by ${name} through the concierge.`,
          guest_confirmed: true,
        },
        ctx,
      );
      events.push(outcome.event);

      if (!outcome.ticket) {
        return {
          reply: `I couldn't save that request — the database write failed, so nothing has been filed. Please use the Support form or call ${property.hostName} on ${property.hostPhone}.`,
          toolEvents: events,
          ticket: null,
        };
      }

      const ticket = outcome.ticket;
      return {
        reply: [
          `Filed. Your ticket is ${ticket.ticketCode}, marked ${ticket.priority} priority.`,
          ``,
          `${property.hostName} has it in the host dashboard and has been notified. Keep the code — you can follow the status under Support, and I can look it up for you any time.`,
          ``,
          `I can't promise a repair time, but if it becomes unsafe, call 112.`,
        ].join("\n"),
        toolEvents: events,
        ticket,
      };
    }

    if (!affirmative(text) && contains(text, FAULT_WORDS)) {
      // The guest answered with more detail instead of yes: re-confirm with it.
      return proposeTicket(rawInput, history, ctx, events);
    }
  }

  if (asksForPreferences(previousAssistant) && affirmative(text)) {
    const source = previousUserMessage(history, rawInput);
    const interests = interestsFrom(source?.content ?? "");
    const outcome = await executeTool(
      "save_guest_preferences",
      {
        interests,
        notes: interests.length ? `Noted during the concierge conversation.` : "",
        consented: true,
      },
      ctx,
    );
    events.push(outcome.event);

    return {
      reply: interests.length
        ? `Saved — I'll use ${interests.join(", ")} when I suggest places for the rest of your stay. Ask me to forget them any time.`
        : `Saved. Ask me to forget them any time.`,
      toolEvents: events,
      ticket: null,
    };
  }

  /* ------------------------------------------------------------ The plan */
  // Checked before the topic matchers: "more outdoor activities" is about the
  // plan, and must not be mistaken for an appliance question.
  if (
    contains(text, [
      "itinerary",
      "plan my stay",
      "plan my trip",
      "plan my days",
      "plan my visit",
      "day-by-day",
      "day by day",
      "schedule my",
      "organise my",
      "organize my",
      "two-day",
      "three-day",
      "four-day",
      "2-day",
      "3-day",
      "my plan",
      "my itinerary",
    ])
  ) {
    return planReply(rawInput, text, ctx, events);
  }

  /* -------------------------------------------------- 3. Wi-Fi and network */
  if (contains(text, ["wifi", "wi-fi", "internet", "network", "password"])) {
    const read = await readSection(ctx, "wifi");
    events.push(read.event);
    return {
      reply: [
        `The network is "${property.wifiName}" and the password is ${property.wifiPassword}.`,
        ``,
        `It is a fibre connection, and the router is in the hallway cupboard if it ever needs a restart. You can also copy the password from My stay → Wi-Fi.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* --------------------------------------------------- 4. Getting in / out */
  if (contains(text, ["check out", "check-out", "checkout", "depart", "leaving", "leave the apartment"])) {
    const read = await readSection(ctx, "access");
    events.push(read.event);
    return {
      reply: [
        `Check-out is ${property.checkOut}.`,
        ``,
        `${property.checkOutInstructions}`,
        ``,
        `If you'd like to leave later, tell me and I'll ask ${property.hostName} — it needs her approval, so I can't promise it.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  if (
    contains(text, [
      "check in",
      "check-in",
      "checkin",
      "arrive",
      "arrival",
      "lockbox",
      "keypad",
      "keys",
      "the door",
      "how do i get in",
      "access",
    ])
  ) {
    const read = await readSection(ctx, "access");
    events.push(read.event);
    return {
      reply: [
        `Check-in is from ${property.checkIn}.`,
        ``,
        `${property.checkInInstructions}`,
        ``,
        `If the keypad or lockbox gives you trouble, tell me and I'll file it with ${property.hostName} straight away.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* ----------------------------------------------------------- 5. Appliances */
  const appliance = applianceFor(property, text);
  if (appliance) {
    const read = await readSection(ctx, "appliances");
    events.push(read.event);
    return {
      reply: `${appliance.appliance}\n\n${appliance.instructions}`,
      toolEvents: events,
      ticket: null,
    };
  }

  /* ---------------------------------------------------------- 6. House rules */
  if (contains(text, ["rule", "quiet", "noise", "smoke", "smoking", "party", "parties", "pet", "dog", "cat", "visitor", "overnight"])) {
    const read = await readSection(ctx, "house_rules");
    events.push(read.event);
    return {
      reply: [`The house rules for ${property.name}:`, ``, ...property.houseRules.map((rule) => `• ${rule}`)].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* ----------------------------------------------------------- 7. Amenities */
  if (contains(text, ["amenity", "amenities", "what's included", "what is included", "provide", "rooftop", "terrace", "lift", "elevator", "netflix", "iron", "hairdryer", "hair dryer"])) {
    const read = await readSection(ctx, "amenities");
    events.push(read.event);
    return {
      reply: [
        `What the apartment has:`,
        ``,
        ...property.amenities.map((amenity) => `• ${amenity}`),
        ``,
        `Anything that isn't on that list, ask me and I'll check the record or ask ${property.hostName}.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* --------------------------------------------------------- 8. Host contact */
  if (
    contains(text, ["host", "marta", "contact me", "call me", "phone me", "speak to someone", "talk to someone", "who do i ask"]) &&
    !contains(text, ["phone number", "host contact"])
  ) {
    const outcome = await executeTool(
      "notify_host",
      {
        message: `${name} asked to be contacted by the host: "${sentence(rawInput, 160)}".`,
        urgent: false,
      },
      ctx,
    );
    events.push(outcome.event);
    return {
      reply: [
        `I've passed that to ${property.hostName} — she'll see it in her dashboard.`,
        ``,
        `You can also reach her directly on ${property.hostPhone} or at ${property.hostEmail}. She usually replies within the hour.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* --------------------------------------------------- 9. Preferences note */
  const interests = interestsFrom(rawInput);
  if (
    interests.length &&
    contains(text, ["i like", "i love", "i enjoy", "i prefer", "i'm into", "interested in", "we like", "we love"])
  ) {
    return {
      reply: [
        `Noted: ${interests.join(", ")}.`,
        ``,
        `Shall I remember that so the guide and my suggestions stay shaped around it? Reply yes and I'll save it — it's deleted when your stay ends, and you can ask me to forget it sooner.`,
      ].join("\n"),
      toolEvents: [],
      ticket: null,
    };
  }

  /* ---------------------------------------------- 10. Local recommendations */
  const wantsGuide = contains(text, [
    "restaurant",
    "restaurants",
    "eat",
    "food",
    "dinner",
    "lunch",
    "breakfast",
    "brunch",
    "tapas",
    "paella",
    "bar",
    "bars",
    "drink",
    "drinks",
    "cocktail",
    "nightlife",
    "club",
    "music",
    "museum",
    "museums",
    "art",
    "gaudi",
    "sagrada",
    "park",
    "parks",
    "beach",
    "shop",
    "shopping",
    "market",
    "coffee",
    "cafe",
    "recommend",
    "recommendation",
    "recommendations",
    "nearby",
    "around here",
    "things to do",
    "what to do",
    "what should i do",
    "what can i do",
    "what should i see",
    "worth doing",
    "worth seeing",
    "sights",
    "tonight",
    "visit",
    "see",
    "activity",
    "cheaper",
    "budget",
    "closer",
    "nearer",
    "quieter",
    "vegetarian",
    "vegan",
    "somewhere else",
    "something else",
    "other options",
  ]);

  const wantsTransport = contains(text, [
    "traffic",
    "metro",
    "bus",
    "transport",
    "how do i get",
    "getting around",
    "get around",
    "taxi",
    "airport",
    "aerobus",
    "train",
  ]);

  if (wantsTransport && !wantsGuide) {
    const outcome = await executeTool("search_local_recommendations", { interests: ["outdoors"], limit: 2 }, ctx);
    events.push(outcome.event);
    return {
      reply: [
        `I don't have live traffic or service updates — nothing in this app can see them, and I won't guess.`,
        ``,
        `What I can say: the apartment is a five-minute walk from Passeig de Gràcia (metro L2/L3/L4) and about ten minutes from Plaça de Catalunya, where the Aerobús from the airport arrives. Taxis from the airport are usually 25–35 minutes depending on traffic.`,
        ``,
        `For live status, check the TMB or Aerobús app before you leave. Want a couple of places near the apartment while you're out?`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  if (wantsGuide) {
    // Context: a short follow-up after a recommendation list is a refinement of
    // it, not a brand-new question.
    const refining = /km away|curated Barcelona guide|Google Places/i.test(
      previousAssistant?.content ?? "",
    );
    const interests = [
      ...guest.preferences.interests,
      ...interestsFrom(rawInput),
      ...categoriesFor(text),
    ];
    const outcome = await executeTool(
      "search_local_recommendations",
      {
        interests,
        categories: categoriesFor(text),
        budget: budgetFor(text),
        time_of_day: timeOfDayFor(text),
        limit: 4,
      },
      ctx,
    );
    events.push(outcome.event);

    const items = Array.isArray(outcome.result.items)
      ? (outcome.result.items as Array<{
          name: string;
          category: string;
          neighbourhood: string;
          description: string;
          price: string;
          distanceKm?: number;
          address?: string;
        }>)
      : [];

    if (!items.length) {
      return {
        reply: `The guide came back empty for that one. Tell me a category — food, coffee, culture, nightlife, a market — and I'll try again.`,
        toolEvents: events,
        ticket: null,
      };
    }

    return {
      reply: [
        ...(refining ? ["Narrowing that down from what I suggested before.", ""] : []),
        formatRecommendations(items, String(outcome.result.source ?? "")),
        ``,
        `Tell me your budget or how far you'll walk and I'll narrow it down. If you want, I can remember the kind of places you like for next time.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  /* ------------------------------------------------------ 11. A fault report */
  if (contains(text, FAULT_WORDS)) {
    const specific = contains(text, FAULT_NOUNS);
    if (!specific && text.length < 40) {
      return {
        reply: [
          `Sorry about that — let's get it sorted.`,
          ``,
          `What isn't working: heating, hot water, Wi-Fi, the door or lockbox, or an appliance? A sentence on what you see (and which room) is enough, and I'll put it in front of ${property.hostName}.`,
        ].join("\n"),
        toolEvents: [],
        ticket: null,
      };
    }

    return proposeTicket(rawInput, history, ctx, events);
  }

  /* -------------------------------------------- 12. Explicit report request */
  if (contains(text, ["report a problem", "report an issue", "report it", "file a request", "something isn't right", "something is not right"])) {
    return {
      reply: [
        `I can file it with ${property.hostName} right now.`,
        ``,
        `Tell me what's wrong — the heating, the water, Wi-Fi, the door, an appliance, noise — and which room if it applies. I'll summarise it, show you the ticket text and priority, and file it once you confirm.`,
        ``,
        `You can also use Support, which has the same form and a phone link for emergencies.`,
      ].join("\n"),
      toolEvents: [],
      ticket: null,
    };
  }

  /* ---------------------------------------------------------------- 13. FAQ */
  const faq = faqFor(property, rawInput);
  if (faq) {
    return {
      reply: `${faq.question}\n\n${faq.answer}`,
      toolEvents: [],
      ticket: null,
    };
  }

  /* -------------------------------------------------------------- 14. Misc */
  if (contains(text, ["address", "where is", "where's", "location", "directions"])) {
    const read = await readSection(ctx, "overview");
    events.push(read.event);
    return {
      reply: `${property.name} is at ${property.address}, in ${property.neighbourhood}, ${property.city}.\n\n${property.description}`,
      toolEvents: events,
      ticket: null,
    };
  }

  if (contains(text, ["hello", "hi ", "hey", "good morning", "good evening", "good afternoon"]) || text.trim() === "hi") {
    return {
      reply: `Hello ${name}. I have the ${property.name} record open — Wi-Fi, access, appliances, house rules, the city guide and a direct line to ${property.hostName}. What do you need?`,
      toolEvents: [],
      ticket: null,
    };
  }

  if (contains(text, ["thank", "thanks", "cheers", "bye", "good night"])) {
    return {
      reply: `Any time. I'm here for the rest of your stay — and if something breaks, tell me and I'll file it with ${property.hostName}.`,
      toolEvents: [],
      ticket: null,
    };
  }

  if (contains(text, ["weather", "forecast", "rain"])) {
    return {
      reply: `I don't have live weather here, so I won't guess. Your phone's forecast will be accurate; what I can tell you is what the apartment and the neighbourhood offer whatever the sky does.`,
      toolEvents: [],
      ticket: null,
    };
  }

  /* ---------------------------------------------------------- 15. Not in record */
  return {
    reply: [
      `That one isn't in the ${property.name} record, so I don't want to invent an answer.`,
      ``,
      `I can help with: the Wi-Fi, arrival and the lockbox, check-out, appliances, house rules, amenities, the local guide, and reporting anything that's broken — that becomes a real ticket for ${property.hostName}.`,
      ``,
      `For anything else, ${property.hostName} is on ${property.hostPhone}.`,
    ].join("\n"),
    toolEvents: [],
    ticket: null,
  };
}

/* ---------------------------------------------------------------------------
   The plan, without a model.

   Builds and rebuilds a real saved itinerary from the same curated guide, and
   reads it back. Everything it claims is a row that exists in the database, and
   a missing table is reported as a missing table.
   --------------------------------------------------------------------------- */

const migrationReply = (): TurnResult => ({
  reply: [
    `The plan needs a database table that hasn't been created yet, so nothing was saved.`,
    ``,
    `Run supabase/migrations/2026-12-itinerary.sql in the Supabase SQL editor and reload. Everything else in the app keeps working meanwhile — I can still answer about the apartment and file tickets.`,
  ].join("\n"),
  toolEvents: [],
  ticket: null,
});

async function planReply(
  rawInput: string,
  text: string,
  ctx: Ctx,
  events: ToolEvent[],
): Promise<TurnResult> {
  const { guest, property } = ctx;
  const stayDays = stayDayCount(guest.checkInDate, guest.checkOutDate);

  // "two-day", "3 days", "four-day plan" — never more than the stay itself.
  const dayWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
  };
  const requested = text.match(
    /\b(?:(\d+)|(two|three|four|five|six|seven|one))[\s-]?days?\b/,
  );
  const requestedDays = requested ? Number(requested[1] ?? dayWords[requested[2]]) : null;
  let days = requestedDays ? Math.min(requestedDays, stayDays) : stayDays;

  let existing: ItineraryItem[] = [];
  try {
    existing = await ctx.repo.listItinerary(guest.id);
  } catch (error) {
    if (error instanceof MigrationRequiredError) return migrationReply();
    throw error;
  }

  // A modification keeps the plan's own length unless a new span was asked for,
  // so "make it more outdoor" does not silently stretch a two-day plan to four.
  if (!requestedDays && existing.length) {
    days = Math.min(Math.max(...existing.map((item) => item.day)), stayDays);
  }

  const adjust = contains(text, [
    "modify",
    "change",
    "rebuild",
    "redo",
    "create",
    "build",
    "make me",
    "new plan",
    "plan it",
    "start over",
    "different",
    "more outdoor",
    "more indoor",
    "more outside",
    "more art",
    "more food",
    "less walking",
    "swap",
    "two-day",
    "three-day",
    "four-day",
  ]);
  const showOnly =
    contains(text, [
      "show me my plan",
      "show my plan",
      "what's my plan",
      "what is my plan",
      "read my plan",
      "my itinerary",
    ]) && !adjust;

  if (existing.length && showOnly) {
    return {
      reply: [
        `Here's the plan saved for your stay:`,
        ``,
        formatItinerary(existing),
        ``,
        `Open Plan to tick stops off, remove one, or add your own.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  if (existing.length && !adjust) {
    return {
      reply: [
        `You already have a ${days}-day plan saved (${existing.length} stops):`,
        ``,
        formatItinerary(existing),
        ``,
        `Say "rebuild it" and I'll replace it, or open Plan to edit a single stop.`,
      ].join("\n"),
      toolEvents: events,
      ticket: null,
    };
  }

  const emphasis: string[] = [];
  if (contains(text, ["outdoor", "outside", "park", "walk", "beach", "fresh air"]))
    emphasis.push("outdoors");
  if (contains(text, ["indoor", "museum", "rain", "culture", "art"])) emphasis.push("culture");
  if (contains(text, ["food", "dinner", "restaurant", "eat", "tapas"]))
    emphasis.push("restaurant");
  if (contains(text, ["nightlife", "bar", "drink", "music", "club"])) emphasis.push("nightlife");

  const stops = planStay({
    days,
    interests: [
      ...guest.preferences.interests,
      ...interestsFrom(rawInput),
      ...categoriesFor(text),
      ...emphasis,
    ],
  });

  if (!stops.length) {
    return {
      reply: `The guide came back empty, so I couldn't build a plan. Try asking for restaurants or culture and I'll suggest something instead.`,
      toolEvents: events,
      ticket: null,
    };
  }

  let saved: ItineraryItem[] = [];
  try {
    await ctx.repo.clearItinerary(guest.id);
    for (const stop of stops) {
      await ctx.repo.addItineraryItem({
        guestSessionId: guest.id,
        propertyId: property.id,
        day: stop.day,
        slot: stop.slot,
        title: stop.title,
        placeId: stop.placeId,
        notes: stop.notes,
      });
    }
    saved = await ctx.repo.listItinerary(guest.id);
  } catch (error) {
    if (error instanceof MigrationRequiredError) return migrationReply();
    throw error;
  }

  events.push({
    name: "add_itinerary_item",
    label: `Built a ${days}-day plan`,
    status: "ok",
    detail: `${saved.length} stops`,
  });

  return {
    reply: [
      `${existing.length ? "Rebuilt" : "Built"} a ${days}-day plan around ${property.neighbourhood}${
        emphasis.length ? `, weighted towards ${emphasis.join(" and ")}` : ""
      }:`,
      ``,
      formatItinerary(saved),
      ``,
      `Open Plan to tick things off or add your own stops, and tell me if you'd like a day changed. The guide is demonstration data, so confirm hours before you go.`,
    ].join("\n"),
    toolEvents: events,
    ticket: null,
  };
}

async function proposeTicket(
  rawInput: string,
  history: Message[],
  ctx: Ctx,
  events: ToolEvent[],
): Promise<TurnResult> {
  const { property, guest } = ctx;
  const description = sentence(rawInput, 160);
  const priority = priorityFor(clean(rawInput));
  const category = categoryFor(clean(rawInput));

  const earlier = previousUserMessage(history, rawInput);
  const context =
    earlier && earlier.content !== rawInput ? sentence(earlier.content, 80) : "";

  const priorityReason: Record<Priority, string> = {
    urgent: "it could be a safety issue",
    high: "it affects something you need during the stay",
    normal: "it's inconvenient but you can live with it for now",
    low: "it can wait until the host is free",
  };

  return {
    reply: [
      `Understood — I'd file this with ${property.hostName}.`,
      ``,
      `Shall I file it? Reply yes and I'll send it as: "${description}" (${priority} priority, ${category})${context ? `, noting earlier: "${context}"` : ""}.`,
      ``,
      `I'd mark it ${priority} because ${priorityReason[priority]}. You can change nothing about the priority afterwards except by asking ${property.hostName}, so say so now if you'd like it lower.`,
    ].join("\n"),
    toolEvents: events,
    ticket: null,
  };
}

/* ---------------------------------------------------------------------------
   Host summary without a model.

   Extractive and deliberately plain: it labels itself as rule-based so nobody
   mistakes it for a model-written brief.
   --------------------------------------------------------------------------- */

export function guidedConversationSummary(args: {
  propertyName: string;
  guestName: string;
  messages: Message[];
}): string {
  const guestMessages = args.messages.filter((message) => message.role === "user");
  const conciergeMessages = args.messages.filter((message) => message.role === "assistant");

  const codes = Array.from(
    new Set(
      args.messages
        .map((message) => message.content.match(/MT-[A-Z0-9]{4}/)?.[0])
        .filter((code): code is string => Boolean(code)),
    ),
  );

  const questions = guestMessages
    .map((message) => sentence(message.content, 90))
    .filter(Boolean)
    .slice(0, 3);

  const reported = guestMessages
    .filter((message) =>
      /not working|doesn't work|broken|leak|blocked|no hot water|noise|locked out|smell/i.test(
        message.content,
      ),
    )
    .map((message) => sentence(message.content, 90))
    .filter(Boolean)
    .slice(0, 2);

  const negative = args.messages.some((message) =>
    /sorry|unfortunately|can't|cannot|failed|not working|broken/i.test(message.content),
  );
  const resolved = codes.length > 0;

  return [
    `Needs: ${questions.length ? questions.join("; ") : "No specific requests."}`,
    `Issues: ${
      codes.length
        ? `Tickets ${codes.join(", ")} filed.${
            reported.length ? ` Reported: ${reported.join("; ")}` : ""
          }`
        : reported.length
          ? `Reported, no ticket filed: ${reported.join("; ")}`
          : "None."
    }`,
    `Sentiment: ${
      negative
        ? "The guest reported at least one problem; the tone stays cooperative but the stay is not frictionless."
        : "The conversation is neutral to positive, with no complaints recorded."
    }`,
    `Action: ${
      resolved
        ? "Check the ticket status and reply in the guest's thread once there is an update."
        : "No action needed unless a ticket is opened."
    }`,
    ``,
    `Generated locally from the transcript by rule-based extraction — no language model was used.`,
  ].join("\n");
}
