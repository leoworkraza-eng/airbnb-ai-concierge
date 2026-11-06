import type { GuestSession, Place, Property, PropertyInput } from "./types";
import { todayISO } from "./utils";

/* ---------------------------------------------------------------------------
   Demo property: Casa Barcelona.

   Every field here is fictional content written for this prototype. It is the
   single source of truth the concierge is allowed to quote for property facts,
   and it is fully editable from the host dashboard once seeded.
   --------------------------------------------------------------------------- */

export const DEMO_HOST = {
  id: "demo-host-casa-barcelona",
  email: "host@casabarcelona.demo",
  fullName: "Marta Serra",
  role: "host" as const,
};

export const DEMO_PROPERTY_ID = "casa-barcelona";

export function demoPropertyInput(hostId = DEMO_HOST.id): PropertyInput {
  return {
    name: "Casa Barcelona",
    address: "Carrer de Mallorca 245, 3º B",
    neighbourhood: "Eixample",
    city: "Barcelona",
    description:
      "A restored Eixample apartment with hydraulic floors, tall shuttered windows and a small rooftop terrace. Two bedrooms, a full kitchen and a five-minute walk to Passeig de Gràcia.",
    hostName: "Marta",
    hostPhone: "+34 600 123 456",
    hostEmail: "marta@casabarcelona.demo",
    checkIn: "15:00",
    checkOut: "11:00",
    checkInInstructions:
      "The street door is at Carrer de Mallorca 245. Enter 245 on the keypad and press the bell symbol. The lockbox is mounted on the right-hand wall inside the lobby; the code is 4821. Take the lift to the third floor, apartment B. Please close the street door firmly behind you.",
    checkOutInstructions:
      "Leave the keys in the lockbox and close it. Please switch off the air conditioning, close the shutters and take rubbish to the bins in the inner courtyard. Check-out is at 11:00 — message the concierge if you would like to ask about a later departure.",
    wifiName: "CasaBarcelona_Guest",
    wifiPassword: "Barcelona2026Demo",
    houseRules: [
      "No smoking inside the apartment or on the terrace.",
      "Quiet hours are 22:00–08:00 out of respect for neighbours.",
      "No parties or events, and no guests staying overnight beyond the booking.",
      "The apartment sleeps four. Please do not exceed that number.",
      "Close the shutters and switch off the air conditioning when you go out.",
    ],
    amenities: [
      "Fibre Wi-Fi (600 Mbps)",
      "Air conditioning in living room and bedrooms",
      "Washer-dryer",
      "Dishwasher",
      "Nespresso coffee machine",
      "Smart TV with Netflix",
      "Rooftop terrace (08:00–22:00)",
      "Lift",
      "Hair dryer and iron",
      "Travel cot and high chair on request",
    ],
    applianceInstructions: [
      {
        appliance: "Washing machine",
        instructions:
          "The washer-dryer is in the bathroom cupboard. Load the drum, add detergent to the left drawer, then turn the dial to Mix 40° and press Start. For a combined wash and dry cycle, press the Dry button until 90 min is shown. The cycle takes about 3 hours. Please leave the door ajar afterwards so the drum dries.",
      },
      {
        appliance: "Air conditioning",
        instructions:
          "Each room has its own remote. Press the power button, choose the snowflake symbol for cooling, then set 24°C. Use the fan symbol for ventilation only. Please switch units off when the windows are open.",
      },
      {
        appliance: "Nespresso machine",
        instructions:
          "Lift the lever, insert a capsule, close it and press the small cup for espresso or the large cup for a long coffee. The water tank lifts off at the back. Capsules are in the drawer beside the machine.",
      },
      {
        appliance: "Oven and hob",
        instructions:
          "The hob is induction: place a pan on the ring, then press the power symbol and '+' to set the heat. The oven dial is on the right of the control panel; select the fan symbol and the temperature. The oven takes about 8 minutes to reach 180°C.",
      },
      {
        appliance: "Dishwasher",
        instructions:
          "Load the baskets, add a tablet to the compartment in the door, and select Eco 50°. Press Start and the cycle runs for about 2 hours 15 minutes. Rinse aid is already filled.",
      },
      {
        appliance: "Smart TV",
        instructions:
          "Press the home button on the Samsung remote, then choose Netflix. The apartment's own profile is signed in and already connected to the Wi-Fi. Please sign out of any personal accounts before you leave.",
      },
    ],
    emergencyInformation:
      "For any emergency in Spain dial 112 (police, fire, ambulance — English spoken). The water shut-off valve is under the kitchen sink, behind the blue panel. The electrical fuse box is in the entrance hallway, top left. The host's mobile is +34 600 123 456. For a lockout, call the host and then the building caretaker on the ground floor.",
    faqs: [
      {
        question: "Can I leave my luggage before check-in or after check-out?",
        answer:
          "Yes, subject to availability. The building lobby has a secure luggage corner, but please ask the concierge to confirm with Marta before leaving anything there.",
      },
      {
        question: "Is there a parking space?",
        answer:
          "The apartment does not include parking. The nearest public car park is on Carrer de Roger de Llúria, about 4 minutes' walk away. We cannot reserve a space or quote current prices.",
      },
      {
        question: "How do I get from the airport?",
        answer:
          "The Aerobús runs from both terminals to Plaça de Catalunya, roughly 35 minutes, and the apartment is a 10-minute walk from there. A taxi from the airport typically takes 25–35 minutes depending on traffic. We cannot provide live traffic information.",
      },
      {
        question: "Are towels and linen provided?",
        answer:
          "Yes. Two towels per guest, bed linen and a set of bathroom essentials are provided. Spare towels are in the wardrobe of the main bedroom.",
      },
      {
        question: "Can I have an early check-in?",
        answer:
          "Sometimes. The apartment is usually ready by 15:00. Ask the concierge and we will check with Marta; we will never confirm a time that has not been agreed.",
      },
    ],
    settings: {
      tone: "warm",
      extraInstructions:
        "Marta welcomes guests personally when she can. Mention the rooftop terrace and the nearest metro (Passeig de Gràcia, L2/L3) when it is useful. Never quote a price for a taxi or a restaurant bill.",
      servicePreferences:
        "Guests travelling for a special occasion may be offered a cava welcome bottle; confirm with Marta before promising anything. Extra cleaning can be arranged with 24 hours' notice.",
      escalationInstructions:
        "Call Marta immediately for water leaks, loss of power, lockouts, or anything involving gas. For non-urgent issues, create a maintenance request and notify the host. Never promise a repair time.",
    },
  };
}

export function demoProperty(hostId = DEMO_HOST.id): Property {
  const now = new Date().toISOString();
  return {
    id: DEMO_PROPERTY_ID,
    hostId,
    ...demoPropertyInput(hostId),
    createdAt: now,
    updatedAt: now,
  };
}

export const DEMO_GUEST = {
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
} as const;

export function demoGuestSession(propertyId = DEMO_PROPERTY_ID): GuestSession {
  return {
    id: "demo-guest-session",
    propertyId,
    guestName: DEMO_GUEST.name,
    checkInDate: todayISO(0),
    checkOutDate: todayISO(4),
    preferences: { interests: [], notes: "", consent: false },
    createdAt: new Date().toISOString(),
  };
}

/* ---------------------------------------------------------------------------
   Curated Barcelona guide.

   This is demonstration content for this prototype, not live venue data.
   Real landmarks appear with stable, factual descriptions; venue style entries
   are fictional and clearly labelled in the UI so nobody mistakes them for
   verified opening hours or prices.
   --------------------------------------------------------------------------- */

export const barcelonaPlaces: Place[] = [
  {
    id: "pl-sagrada",
    name: "Sagrada Família",
    category: "culture",
    neighbourhood: "Eixample",
    description:
      "Gaudí's unfinished basilica. Book a timed entry online; late afternoon light through the stained glass is the reason most people go twice.",
    price: 2,
    tags: ["architecture", "gaudi", "landmark", "must-see"],
    distanceKm: 1.8,
    bestTime: "afternoon",
  },
  {
    id: "pl-park-guell",
    name: "Park Güell",
    category: "outdoors",
    neighbourhood: "Gràcia",
    description:
      "Mosaic terraces and city views above Gràcia. The monumental zone needs a ticket; the surrounding park paths are free.",
    price: 1,
    tags: ["gaudi", "views", "walking", "outdoors"],
    distanceKm: 4.1,
    bestTime: "morning",
  },
  {
    id: "pl-casa-batllo",
    name: "Casa Batlló",
    category: "culture",
    neighbourhood: "Eixample",
    description:
      "Gaudí's blue-tiled townhouse on Passeig de Gràcia, ten minutes on foot from the apartment. Evening visits are quieter.",
    price: 2,
    tags: ["architecture", "gaudi", "museum", "nearby"],
    distanceKm: 0.6,
    bestTime: "evening",
  },
  {
    id: "pl-macba",
    name: "MACBA",
    category: "culture",
    neighbourhood: "El Raval",
    description:
      "Contemporary art museum with a bright white gallery and a plaza that fills with skaters in the afternoon.",
    price: 1,
    tags: ["art", "contemporary", "museum", "rainy-day"],
    distanceKm: 2.2,
    bestTime: "afternoon",
  },
  {
    id: "pl-miro",
    name: "Fundació Joan Miró",
    category: "culture",
    neighbourhood: "Montjuïc",
    description:
      "Miró's foundation on Montjuïc hill: sculpture terraces, rooftop views and a calm garden café.",
    price: 2,
    tags: ["art", "museum", "views", "quiet"],
    distanceKm: 3.9,
    bestTime: "morning",
  },
  {
    id: "pl-boqueria",
    name: "Mercat de la Boqueria",
    category: "market",
    neighbourhood: "El Raval",
    description:
      "Barcelona's best-known market off La Rambla. Go before 10:00 for the produce stalls rather than the smoothie counters.",
    price: 1,
    tags: ["market", "food", "local", "morning"],
    distanceKm: 1.9,
    bestTime: "morning",
  },
  {
    id: "pl-barceloneta",
    name: "Barceloneta beach",
    category: "outdoors",
    neighbourhood: "Barceloneta",
    description:
      "The city beach, 20 minutes by metro. Walk north towards Bogatell for a quieter stretch and a proper sunset.",
    price: 1,
    tags: ["beach", "sunset", "swimming", "free"],
    distanceKm: 3.4,
    bestTime: "afternoon",
  },
  {
    id: "pl-bunkers",
    name: "Bunkers del Carmel",
    category: "outdoors",
    neighbourhood: "Horta-Guinardó",
    description:
      "A 360° viewpoint over the whole city on the site of an old anti-aircraft battery. Bring water and something to sit on.",
    price: 1,
    tags: ["views", "sunset", "free", "walking"],
    distanceKm: 4.8,
    bestTime: "evening",
  },
  {
    id: "pl-llibreria",
    name: "Llibreria Finestres",
    category: "shopping",
    neighbourhood: "Eixample",
    description:
      "An elegant independent bookshop and gallery in a restored townhouse, with a good selection in English and Catalan.",
    price: 1,
    tags: ["books", "design", "quiet", "shopping"],
    distanceKm: 0.9,
    bestTime: "afternoon",
  },
  {
    id: "pl-encants",
    name: "Mercat dels Encants",
    category: "shopping",
    neighbourhood: "El Clot",
    description:
      "Barcelona's oldest flea market under a mirrored canopy. Best on Monday, Wednesday, Friday and Saturday mornings.",
    price: 1,
    tags: ["vintage", "market", "design", "bargains"],
    distanceKm: 2.7,
    bestTime: "morning",
  },
  {
    id: "pl-gaudi-ave",
    name: "Avinguda de Gaudí",
    category: "outdoors",
    neighbourhood: "Eixample",
    description:
      "A shaded pedestrian avenue leading to the Sagrada Família, with benches, plane trees and a kiosk that opens early.",
    price: 1,
    tags: ["walk", "free", "nearby", "coffee"],
    distanceKm: 1.4,
    bestTime: "any",
  },
  {
    id: "pl-montjuic",
    name: "Montjuïc gardens",
    category: "outdoors",
    neighbourhood: "Montjuïc",
    description:
      "Terraced gardens and the Olympic ring above the port. Take the cable car back down for the view over the harbour.",
    price: 1,
    tags: ["gardens", "views", "walking", "family"],
    distanceKm: 4.2,
    bestTime: "morning",
  },
  {
    id: "pl-tapas-mallorca",
    name: "La Cuina de Mallorca",
    category: "restaurant",
    neighbourhood: "Eixample",
    description:
      "Prototype venue: a small counter-and-tables tapas room doing vermouth, anchovies and grilled vegetables. Designed for a mid-budget dinner near the apartment.",
    price: 2,
    tags: ["tapas", "local", "wine", "mid-budget", "italian-friendly"],
    distanceKm: 0.4,
    bestTime: "evening",
  },
  {
    id: "pl-pasta-born",
    name: "Forn de Pasta",
    category: "restaurant",
    neighbourhood: "El Born",
    description:
      "Prototype venue: fresh pasta and natural wine in a narrow El Born room. A reliable affordable option if you want Italian food without a long walk.",
    price: 2,
    tags: ["italian", "pasta", "affordable", "wine", "dinner"],
    distanceKm: 1.7,
    bestTime: "evening",
  },
  {
    id: "pl-pizza-gracia",
    name: "Pizza de Gràcia",
    category: "restaurant",
    neighbourhood: "Gràcia",
    description:
      "Prototype venue: wood-fired pizza sold by the slice until late, with a couple of pavement tables. Cheap, quick and open when most kitchens close.",
    price: 1,
    tags: ["pizza", "italian", "cheap", "late", "casual"],
    distanceKm: 2.6,
    bestTime: "evening",
  },
  {
    id: "pl-vermut-sants",
    name: "Vermut de Sants",
    category: "cafe",
    neighbourhood: "Sants",
    description:
      "Prototype venue: an old-school vermouth bar with marble counters and a short list of preserves and cheese.",
    price: 1,
    tags: ["vermut", "local", "cheap", "afternoon"],
    distanceKm: 3.2,
    bestTime: "afternoon",
  },
  {
    id: "pl-cafe-eixample",
    name: "Cafè de la Llum",
    category: "cafe",
    neighbourhood: "Eixample",
    description:
      "Prototype venue: a bright corner café with filtered coffee, Catalan pastries and laptops tolerated before noon.",
    price: 1,
    tags: ["coffee", "breakfast", "wifi", "nearby", "affordable"],
    distanceKm: 0.3,
    bestTime: "morning",
  },
  {
    id: "pl-cafe-raval",
    name: "Taller de Cafè",
    category: "cafe",
    neighbourhood: "El Raval",
    description:
      "Prototype venue: a tiny roastery with a single bench outside, good for a quick flat white between museums.",
    price: 1,
    tags: ["coffee", "specialty", "quick", "affordable"],
    distanceKm: 2.0,
    bestTime: "morning",
  },
  {
    id: "pl-night-born",
    name: "Soterrani del Born",
    category: "nightlife",
    neighbourhood: "El Born",
    description:
      "Prototype venue: a low-lit basement bar with vinyl DJs, a small dance floor and no strict dress code. Busiest after midnight.",
    price: 2,
    tags: ["nightlife", "cocktails", "dancing", "late", "music"],
    distanceKm: 1.8,
    bestTime: "evening",
  },
  {
    id: "pl-night-poble",
    name: "Terrassa del Poblenou",
    category: "nightlife",
    neighbourhood: "Poblenou",
    description:
      "Prototype venue: a rooftop terrace with long tables and a relaxed crowd, ten minutes from the beach. Good for groups.",
    price: 2,
    tags: ["nightlife", "rooftop", "groups", "beach", "cocktails"],
    distanceKm: 3.6,
    bestTime: "evening",
  },
  {
    id: "pl-night-gracia",
    name: "Bar de la Plaça",
    category: "nightlife",
    neighbourhood: "Gràcia",
    description:
      "Prototype venue: a neighbourhood square bar where people drink outside until the small hours. Cheap beer, no cocktails.",
    price: 1,
    tags: ["nightlife", "cheap", "local", "late", "casual"],
    distanceKm: 2.4,
    bestTime: "evening",
  },
  {
    id: "pl-flamenco",
    name: "Tablao del Carmen",
    category: "nightlife",
    neighbourhood: "El Gòtic",
    description:
      "Prototype venue: a small flamenco tablao with a 45-minute show and a drink included. Book ahead; tables are close together.",
    price: 3,
    tags: ["flamenco", "show", "culture", "evening", "booking"],
    distanceKm: 2.1,
    bestTime: "evening",
  },
  {
    id: "pl-cinema",
    name: "Cinema Alcázar",
    category: "culture",
    neighbourhood: "Eixample",
    description:
      "Prototype venue: an art-house cinema showing original-version films, with a small bar in the lobby.",
    price: 1,
    tags: ["cinema", "rainy-day", "evening", "nearby", "affordable"],
    distanceKm: 1.1,
    bestTime: "evening",
  },
  {
    id: "pl-picnic",
    name: "Parc de la Ciutadella",
    category: "outdoors",
    neighbourhood: "Ciutadella",
    description:
      "The city's central park: a lake for rowing boats, wide lawns and the Gaudi-designed fountain. Buy picnic supplies on the way.",
    price: 1,
    tags: ["park", "picnic", "free", "family", "afternoon"],
    distanceKm: 2.3,
    bestTime: "afternoon",
  },
];

/** Stable, non-live transport guidance the concierge may quote. */
export const transportGuidance = [
  "Metro: the apartment is 5 minutes from Passeig de Gràcia (L2, L3, L4) and 8 minutes from Girona (L4).",
  "Airport: Aerobús A1/A2 to Plaça de Catalunya takes roughly 35 minutes; the R2 Nord train from Terminal 2 reaches Passeig de Gràcia in about 25 minutes.",
  "City centre: Plaça de Catalunya is a 12–15 minute walk or two metro stops from Passeig de Gràcia.",
  "Tickets: a T-casual card covers 10 journeys on metro and bus; contactless bank cards also work on the metro.",
  "Taxis: official black-and-yellow taxis only. The app-based options are Cabify and Bolt; Uber operates in Barcelona with licensed drivers.",
  "Bikes: Bicing is for residents only; several private bike-hire shops are within 10 minutes' walk.",
];

export const LIVE_TRANSPORT_UNAVAILABLE =
  "Live traffic, road incidents and real-time service alerts are not connected in this prototype. Share general guidance, and say clearly that live traffic data is unavailable rather than guessing.";
