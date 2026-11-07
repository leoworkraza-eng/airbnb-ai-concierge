# Airbnb AI Concierge

A host-and-guest connection site with a concierge foundation. Guests create
independent accounts, browse public host profiles and ask to connect. Hosts create
their own profile and first offering, then accept or decline requests. Existing stay
tools add the original concierge experience.

**Live:** <https://airbnb-ai-concierge-zeta.vercel.app>

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, **Claude**
(Anthropic Messages API with tool use), and **Supabase** (Postgres, Auth, RLS).

> **Disclaimer** — This is an independent educational prototype. It is not
> affiliated with, endorsed by, or connected to Airbnb. All property, guest and
> venue details are fictional demonstration data.

---

## Host and guest flow

- **Guest accounts** are standalone Supabase Auth users tagged
  `app_metadata.role = "guest"`. Any valid email can join; if the email matches an
  official reservation, the stay is linked automatically. No booking is required.
- **Host accounts** are tagged `app_metadata.role = "host"`. Host signup creates the
  profile and the host's first offering. A new host is never seeded with the demo
  Casa Barcelona property.
- **Browsing:** `/hosts` is the public directory; `/hosts/[hostId]` is the public host
  profile with one clear “Ask to connect” action.
- **Affiliations:** guests track requests in `/connections`; hosts answer them in
  `/host/affiliations`. Pending, accepted, declined and retry states are visible to
  both sides.
- **Reservations:** a host can create a reservation; signup with the matching email
  links the stay, and the guest can request affiliation from “My stay”.
- **Role guards:** guest accounts cannot open the host workspace, and host accounts
  cannot open the guest profile area.

---

## What works

| Area | Behaviour |
| --- | --- |
| Guest accounts | Independent signup with any valid email, optional booking linking, and a clear no-stay state. |
| Host onboarding | Self-service account plus first offering; the public profile is built from what the host enters. |
| Host directory | Guests browse hosts and offerings, open profiles, and request a connection. |
| Affiliations | Host accepts or declines; guest and host see the same status; declined requests can be retried. |
| Guest demo | Optional one-click demo stay on the demo property, with a signed cookie. It does not create an account and cannot receive a host answer. |
| My stay | Check-in/out steps, Wi-Fi with copy button, house rules, appliance guides, amenities, emergency info, FAQs, host contact — all from the database. |
| Concierge | Real Claude Messages API call with a tailored system prompt, conversation history and five tools. |
| Guided mode | With no model key at all, the concierge still works: a deterministic agent answers from the same property record and curated guide, and files real tickets with a confirmation step. It is labelled “Guided mode” in the UI and never claims to be a language model. |
| Tool: `get_property_information` | Reads the verified property record. The prompt contains **no** property facts, so the model must call this tool. |
| Tool: `create_maintenance_request` | Writes a genuine ticket + host notification, returns the real ticket code and priority. |
| Tool: `save_guest_preferences` | Stores interests/notes only after explicit guest consent. |
| Tool: `notify_host` | Writes a host notification row. |
| Tool: `search_local_recommendations` | Ranks the curated Barcelona dataset; optionally uses Google Places when a key is configured. |
| Plan | A saved, editable day-by-day itinerary built from the curated guide: three stops a day, ordered by the guest's interests, with tick-off, custom stops and a rebuild. The concierge reads and edits the same plan through `get_itinerary` / `add_itinerary_item`, in both model and guided mode. |
| Explore | Filterable Barcelona guide, clearly labelled as curated demonstration data. |
| Support | Guest-facing request form, emergency escalation to 112, and a list of that guest's tickets. |
| Host accounts | Self-service profile and first offering, Supabase email/password when configured, otherwise a documented demo host account. |
| Host overview | Properties, current guests, next arrivals, open requests, unread notifications, recent interactions. |
| Reservations | Per-property stays with an explicit source label (`manual`, `demo`, or `airbnb`), inline status changes and a link to the guest session. New stays can be added by hand and are validated server-side. |
| Airbnb connection | Connection state, server-side credential storage, a sync log and honest failure messages. There is no live Airbnb access: the API is partner-only, so nothing is ever presented as imported. |
| Property management | Add/edit the complete property record that the concierge answers from. |
| Maintenance | All tickets with filters, priority and inline status changes (New → In progress → Resolved). |
| Guest interactions | Transcript review plus on-demand Claude summaries stored in the database. |
| AI settings | Tone, extra instructions, service preferences, escalation instructions. Safety rules are fixed. |

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Start with `/hosts` for the public directory, `/guest/signup`
for a guest account, or `/host/signup` for host onboarding.

Without any credentials the app runs on a **local development store** (`.data/concierge.json`):
the demo property, guests, tickets and notifications persist across restarts, and the
host demo account is enabled. The UI states this mode explicitly — it is never presented
as Supabase data.

To enable the concierge, add a real key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-5-5
```

The model identifier is configurable, so moving to a newer Claude model needs no code change.

### Demo accounts

| Role | Credentials |
| --- | --- |
| Guest | Create an account at `/guest/signup` with any valid email, or open the demo stay from `/guest/login` (no account required) |
| Host | `host@casabarcelona.demo` / `Concierge2026` for the demo, or create a new host at `/host/signup` |

With Supabase configured, signup creates confirmed accounts and profiles. No dashboard
setup is needed. A new host adds the first offering as part of onboarding.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For AI | Server-only Claude key. Never sent to the browser. |
| `CLAUDE_MODEL` | No | Model id; defaults to `claude-sonnet-5-5`. |
| `CLAUDE_MAX_TOKENS` | No | Reply cap, default `1200`. |
| `SUPABASE_URL` | For production | Supabase project URL. |
| `SUPABASE_ANON_KEY` | For production | Used with the host's cookies and RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | For production | Server-only; guest and AI flows write through it. |
| `SESSION_SECRET` | Recommended | Signs guest/host cookies. Use 32+ random characters. |
| `DEMO_HOST_EMAIL` / `DEMO_HOST_PASSWORD` | No | Local-mode host account. |
| `DEMO_PROPERTY_ID` | No | Pins the guest demo to a property. |
| `GOOGLE_MAPS_API_KEY` | No | Enables live Google Places recommendations. |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for metadata. |

`.env.example` contains placeholders only. Secrets are git-ignored (`.env`, `.env*.local`).

---

## Supabase setup

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). This creates
   all seven tables, indexes, the `updated_at` triggers and Row Level Security policies.
3. In the same SQL editor, run
   [`supabase/migrations/2026-11-reservations-and-integrations.sql`](supabase/migrations/2026-11-reservations-and-integrations.sql)
   (the `reservations` and `integrations` tables). It is additive: no existing table,
   column or policy is dropped. Until it is applied the app still runs — the reservation
   and Airbnb connection screens explain that the tables are missing, and the rest of the
   product is unaffected. [`supabase/apply-all.sql`](supabase/apply-all.sql) contains the
   same SQL if you prefer one file to paste.

   The guest plan needs no migration: it lives in the `preferences` JSON column of the
   guest's session, which every deployment already has.
4. Copy the project URL, anon key and service-role key into `.env.local`.
5. Open `/host/login` and press **Enter the demo host dashboard** for the demo account,
   or create your own host at `/host/signup`. Signup creates the confirmed account, the
   profile row and the host's first offering. No manual user creation is required; real
   hosts are never seeded with the Casa Barcelona property.
6. Keep `.data/` out of version control (already ignored) and never commit `.env.local`.

### Demo without Supabase (no SQL to paste)

The plan, reservations and host account also run against the local development store,
with no database setup at all:

```bash
npm run build
npm run demo:local     # http://localhost:3200
```

Every screen labels the storage mode it is actually using, so nothing claims to be
Supabase when it isn't. Supabase remains the production path: applying
[`supabase/apply-all.sql`](supabase/apply-all.sql) and running `npm start` switches the
same build back to it.

### Where reservation data comes from

Every reservation row carries a source, shown in the host UI and on the guest page:

* **Added by host** — created in `/host/reservations/new`, stored in your database.
* **Demo data** — the sample stays seeded with the demo property, plus the stay a guest
  demo session claims.
* **Airbnb** — reserved for an approved integration. This app never writes it, because
  it has no authorised Airbnb transport, and it does not scrape the site.

### Access control

* **Hosts** authenticate with Supabase. Every host page and API uses the request-scoped
  Supabase client, so RLS restricts reads/writes to properties where
  `host_id = auth.uid()`. The app additionally verifies property ownership before
  updating tickets.
* **Guests** sign up and sign in through Supabase Auth with `app_metadata.role = "guest"`.
  Guest routes resolve the signed-in user server-side; the optional demo stay uses a
  signed HTTP-only cookie. A guest cannot read another guest's data by changing an id.
* **Role separation** is enforced in the session helpers: a guest account cannot open
  `/host`, and a host account cannot open the guest profile area.
* **Claude** runs only on the server. The browser sends a message, never a key or a
  property id.

---

## The agent

`src/lib/claude/agent.ts` runs a bounded tool loop (max 6 iterations):

1. Load the last 40 messages for the guest's conversation.
2. Call `messages.create` with the concierge system prompt and seven tool definitions.
3. Execute every `tool_use` block against the real repository.
4. Append the assistant turn and `tool_result` blocks, then repeat.
5. Store only the guest-visible reply, with a compact tool trace for the UI.

The system prompt (`src/lib/claude/prompt.ts`) enforces:

* property facts only via `get_property_information`;
* no invented tickets, prices, hours, events or live traffic;
* explicit confirmation before filing a maintenance request;
* consent before saving preferences;
* emergencies to 112 before anything else;
* host tone/service settings that cannot weaken safety, honesty or privacy.

If no key is configured, the route falls back to **guided mode**
(`src/lib/concierge/guided.ts`): a deterministic agent that uses the same tools, quotes
only the host's record, asks for confirmation before filing a ticket, and says when
something is not in the record. The UI labels it as guided mode, so nothing pretends a
model is answering. If a configured model fails, the guest sees a clear error plus the
host's phone number.

---

## Project structure

```
src/
  app/
    page.tsx                     landing page
    stay/ concierge/ explore/ support/    guest experience
    host/                        login, overview, properties, maintenance, guests, settings
    api/
      concierge/                 Claude turn endpoint (rate limited, cookie scoped)
      requests/                  guest support form
      guest/                     start / reset the demo stay
      host/                      login, logout, properties, tickets, summaries, notifications
  components/                    brand, UI primitives, chat, guest + host components
  lib/
    claude/                      prompt, tools, agent, summary
    data/                        repository contract + Supabase and local implementations
    auth.ts                      signed guest/host sessions
    supabase/server.ts           cookie-scoped Supabase client (RLS)
    places.ts                    curated dataset + optional Google Places
    itinerary.ts                 plan vocabulary + deterministic plan builder
    validation.ts                zod schemas
supabase/schema.sql              tables, indexes, triggers, RLS
```

---

## Deploying to Vercel

The current production deployment is <https://airbnb-ai-concierge-zeta.vercel.app>.
The project is linked in `.vercel/`, so the current working tree can be released with:

```bash
npx vercel@latest deploy --prod --yes
```

For a fresh Vercel project:

1. Push the repository to GitHub.
2. Import it in Vercel (framework preset: Next.js — no custom build settings needed).
3. Add the environment variables above for **Production** and **Preview**.
4. Run the Supabase schema in the project you point the deployment at.
5. Deploy. `SUPABASE_*` and `ANTHROPIC_API_KEY` are read server-side only, so do **not**
   prefix them with `NEXT_PUBLIC_`.

Without Supabase configured, a Vercel deployment fails loudly on data access rather than
pretending to save: the local JSON store is restricted to development (Vercel's
filesystem is read-only).

---

## Verification checklist

```bash
npm run typecheck
npm run build
npm run smoke     # end-to-end checks against a running instance
```

The host/guest acceptance suite and live release checklist are in
[`TEST_CHECKLIST.md`](TEST_CHECKLIST.md). With a production build running on port 3102:

```bash
node scripts/qa-flow.mjs
node scripts/qa-links.mjs
```

`npm run smoke` drives the guest's real HTTP surface — session, plan build, tick,
add, remove, validation, cross-guest access and one concierge turn — and asserts
against the stored rows rather than the rendered page. Point it at another port
with `SMOKE_BASE_URL=http://localhost:3102 npm run smoke`. On an instance where
the migrations have not run it reports the plan assertions as skipped, exactly
like the UI.

End-to-end walkthrough (the eight demo scenes):

1. Open `/` → **I'm a Guest**. The stay page shows Casa Barcelona and its dates.
2. Ask *"What's the Wi-Fi password?"* → Claude calls `get_property_information` and
   returns `Barcelona2026Demo`.
3. Ask *"How do I use the washing machine?"* → steps come from the stored guide.
4. Ask *"What can I do around here tonight?"* → recommendations come from the guide,
   labelled as curated demo data (or live Google Places results when configured).
5. Ask about traffic → the concierge states that live traffic data is unavailable and
   gives general transport guidance.
6. Say *"The heating isn't working."* → Claude asks clarifying questions, then asks for
   confirmation and files a real ticket.
7. Sign in at `/host/login` with the demo host account → the ticket appears under
   **Maintenance** with its code, priority and status; change its status.
8. Open **Guest interactions** → generate an AI summary of the conversation.
9. Open **Reservations** → the demo stays are labelled *Demo data*; add one by hand and
   change its status. It appears on the guest welcome page once a guest session claims it.
10. Open **Plan** → **Build a plan**. Three stops a day appear, ordered by the guest's
    interests. Tick one off, remove one, add a stop from the guide or type your own; the
    list is replaced by whatever the database returned, so nothing is ever shown unsaved.
    Then ask the concierge *“Can you modify my itinerary to include more outdoor
    activities?”* — it rebuilds the same saved plan and the Plan page reflects it.
11. Open **Airbnb connection** → save dummy credentials (stored server-side), enable the
    demo connection, and press **Attempt sync**. It fails with a written reason and the
    attempt is recorded in the sync log — nothing is imported.

The acceptance criteria in the product specification map directly onto this flow. Where
an integration needs credentials that are not configured (Claude, Supabase, Google
Places), the UI says so instead of simulating success.

## Run the concierge for free (no card)

Claude is optional. Any OpenAI-compatible chat API with tool calling can drive the
concierge through the exact same tools and database writes — only the transport
differs, and Claude still wins if `ANTHROPIC_API_KEY` is also present.

1. Create a free key at [console.groq.com/keys](https://console.groq.com/keys) — no
   card required.
2. Set `AI_API_KEY` in `.env.local` (and in your host's environment for production).
3. Restart. The concierge badge flips to “Concierge connected”.

Defaults are Groq's `openai/gpt-oss-120b` at `https://api.groq.com/openai/v1` —
Groq retired `llama-3.3-70b-versatile` for free tier in August 2026, so if you
see a "model does not exist" error, that name is the reason. Override with
`AI_BASE_URL` / `AI_MODEL` for Google AI Studio, OpenRouter or any compatible
gateway (`openai/gpt-oss-20b` is the lighter, higher-quota Groq option). Free tiers are rate-limited, so the app's per-guest limit keeps
a demo from exhausting the quota.
