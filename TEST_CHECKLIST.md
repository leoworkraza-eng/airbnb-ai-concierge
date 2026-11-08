# Test checklist

Verified on 8 November 2026 against fresh production builds (`next build` + `next start`).

**Production:** <https://airbnb-ai-concierge-zeta.vercel.app> — deployed 7 November 2026.

## Automated result

- **60/60 flow checks passed** (`scripts/qa-flow.mjs`)
- **34/34 pages loaded cleanly** across public, guest, booking-guest and host contexts (`scripts/qa-links.mjs`)
- **68/68 unique internal links resolved**
- **`npm run build` passed**, including TypeScript checking
- **31/31 planning-mode checks passed:** signup redirects to `/welcome`, all six guest workspace pages return 200, one planning session is reused, and QA data is removed
- **Interaction polish passed:** guest signup with a stale demo cookie resolves the real account, the concierge answered a live Wi-Fi question, the host dashboard rendered with no horizontal overflow, and the browser console showed no runtime errors
- **Live production checks passed:** `/`, `/hosts`, `/guest/signup` and `/host/login` returned 200; the spaced-email API request returned 400
- QA accounts and their offerings, reservations, affiliations and support tickets were removed after the run

## Scenario checklist

| Scenario | Result | What was checked |
| --- | --- | --- |
| First-time guest creates an account | PASS | Standalone signup succeeds with any valid email and lands on `/welcome` in planning mode; no host approval is required |
| Invalid email | PASS | `not-an-email` is rejected with a validation message; no account is created |
| Email containing spaces | PASS | `not alex.rivera@example.com` is rejected before account creation |
| Duplicate guest email | PASS | Existing account is reported clearly instead of creating a second account |
| Wrong guest password | PASS | Sign-in is rejected without revealing account details |
| Returning guest with no booking | PASS | Sign-in succeeds and routes to `/welcome` in planning mode |
| Signed-in “My stay” with no booking | PASS | Shows planning mode on the demo base with a route to find a host, not a dead end |
| Guest without a stay opens `/welcome` | PASS | Planning workspace renders; `/concierge`, `/explore`, `/support` and `/itinerary` all return 200 |
| Guest route loads | PASS | Shell-aware skeleton keeps the header and tabs stable; no layout jump or blank screen |
| Guest signs up after opening a demo | PASS | Demo cookie is cleared; `/welcome` shows the new account and planning mode, not the demo guest |
| Page fails mid-render | PASS | Branded error boundary offers “Try again” plus guest area and home exits |
| Concierge takes too long | PASS | Request aborts after 75s, the message returns to the input with a clear retry message |
| Logged-out protected pages | PASS | `/profile` and `/stay` redirect to guest sign-in with the correct `next` target |
| Guest with no connections | PASS | Useful empty state with a route to browse hosts |
| Host onboarding | PASS | Account and first offering are created together; a new host does not inherit the Casa Barcelona offering |
| Host with no guests | PASS | Empty affiliation state is shown clearly |
| Host saves offering changes | PASS | Saved description is returned by the API and appears on the public host profile |
| Multiple hosts and guests | PASS | Two independent hosts and two guests are listed and remain isolated |
| Guest browses host profiles | PASS | Public directory and host profiles render with offerings and connection CTA |
| Affiliation: pending | PASS | Request appears for both guest and host |
| Affiliation: accepted | PASS | Host accepts; guest sees accepted state in connections and on the host profile |
| Affiliation: declined and retry | PASS | Host declines; guest sees the decline and can ask again |
| Multiple host requests | PASS | Guest can be connected to one host and request another independently |
| Official reservation | PASS | Host creates a reservation and the matching guest account is linked automatically at signup |
| Post-reservation affiliation | PASS | Guest initiates a request from “My stay”; host sees it as reservation-linked |
| Host reservation status | PASS | Host updates reservation status successfully |
| Host notifications | PASS | Host can mark notifications as read |
| Guest support ticket | PASS | Guest submits a maintenance request; it appears in the host workspace |
| Nightlife categories | PASS | Nightlife guide labels venues as Club, Bar and Lounge (plus Flamenco show) |
| Role boundaries | PASS | Guest cannot open the host workspace; host cannot open the guest profile; wrong-role sign-in does not terminate the existing session |
| Navigation and links | PASS | All 68 internal links resolve; no 404/500 destinations |
| Sign-out | PASS | Guest and host sign-out both return to their sign-in pages and protect pages again |
| Home presentation | PASS | Web, Napkin, AI agent and Suno are shown in a simple extendable section |

## What changed

- Guest onboarding is account-first: any valid email can join, bookings are linked automatically when the email matches, and a stay is optional.
- Guest and host sessions are role-separated. Wrong-role attempts no longer revoke the visitor’s valid session.
- “My stay” has an explicit no-stay state and correct signed-in/signed-out routing.
- Hosts create their own profile and first offering during signup; no universal demo property is seeded into real accounts.
- Public host directory and host profiles support browsing and one clear connection request.
- Affiliations support pending, accepted, declined and retry states for both guest and host.
- Reservations can create post-booking affiliation requests.
- Nightlife content uses real venue categories (Club, Bar, Lounge, Flamenco show).
- Navigation, home footer and Host workspace links now reflect the current account state.
- Removed the obsolete booking-based guest login and its dead form/API.
- No unused package was found: every declared dependency is imported by the application.

## Not exercised

- Live Anthropic concierge replies and the optional Airbnb partner integration were not exercised; those legacy surfaces are outside the host/guest connection flow, but their pages render and their links resolve.
- External `tel:`, `mailto:` and OpenStreetMap destinations were not fetched during the automated audit.
- No synthetic guest or host accounts were created on the production database during the live smoke check.
