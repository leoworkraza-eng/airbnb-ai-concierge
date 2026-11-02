# Airbnb AI Concierge

An AI hospitality concierge for short stays: guests get verified property answers,
personalised Barcelona recommendations and a support channel; hosts get a property
record editor, real maintenance tickets and AI-generated conversation summaries.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, **Claude**
(Anthropic Messages API with tool use), and **Supabase** (Postgres, Auth, RLS).

> **Disclaimer** — This is an independent educational prototype. It is not
> affiliated with, endorsed by, or connected to Airbnb. All property, guest and
> venue details are fictional demonstration data.

---

## What works

| Area | Behaviour |
| --- | --- |
| Guest demo | One click creates a stay on the demo property and sets a signed cookie. No signup. |
| My stay | Check-in/out steps, Wi-Fi with copy button, house rules, appliance guides, amenities, emergency info, FAQs, host contact — all from the database. |
| Concierge | Real Claude Messages API call with a tailored system prompt, conversation history and five tools. |
| Tool: `get_property_information` | Reads the verified property record. The prompt contains **no** property facts, so the model must call this tool. |
| Tool: `create_maintenance_request` | Writes a genuine ticket + host notification, returns the real ticket code and priority. |
| Tool: `save_guest_preferences` | Stores interests/notes only after explicit guest consent. |
| Tool: `notify_host` | Writes a host notification row. |
| Tool: `search_local_recommendations` | Ranks the curated Barcelona dataset; optionally uses Google Places when a key is configured. |
| Explore | Filterable Barcelona guide, clearly labelled as curated demonstration data. |
| Support | Guest-facing request form, emergency escalation to 112, and a list of that guest's tickets. |
| Host auth | Supabase email/password when configured, otherwise a documented demo host account. |
| Host overview | Properties, current guests, open requests, unread notifications, recent interactions. |
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

Open <http://localhost:3000>.

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
| Guest | Click **I'm a Guest** — no account required |
| Host (local mode) | `host@casabarcelona.demo` / `Concierge2026` |

With Supabase configured, create host users in **Supabase → Authentication → Users**.
A matching `profiles` row is created automatically on first sign-in.

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
3. Copy the project URL, anon key and service-role key into `.env.local`.
4. Create a host user in **Authentication → Users** (or use the sign-up flow of your
   choice), then sign in at `/host/login`. The first sign-in creates the profile row, and
   a starter property (Casa Barcelona) is seeded so the demo works immediately.
5. Keep `.data/` out of version control (already ignored) and never commit `.env.local`.

### Access control

* **Hosts** authenticate with Supabase. Every host page and API uses the request-scoped
  Supabase client, so RLS restricts reads/writes to properties where
  `host_id = auth.uid()`. The app additionally verifies property ownership before
  updating tickets.
* **Guests** never touch Supabase directly. Their server routes use the service-role key
  and resolve the stay from a signed, HTTP-only cookie — a guest cannot read another
  guest's conversation by changing an id in a request.
* **Claude** runs only on the server. The browser sends a message, never a key or a
  property id.

---

## The agent

`src/lib/claude/agent.ts` runs a bounded tool loop (max 6 iterations):

1. Load the last 40 messages for the guest's conversation.
2. Call `messages.create` with the concierge system prompt and five tool definitions.
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

If the key is missing the chat shows a configuration notice instead of pretending; if
Claude fails, the guest sees a clear error plus the host's phone number.

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
    validation.ts                zod schemas
supabase/schema.sql              tables, indexes, triggers, RLS
```

---

## Deploying to Vercel

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
```

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

Defaults are Groq's `llama-3.3-70b-versatile` at `https://api.groq.com/openai/v1`.
Override with `AI_BASE_URL` / `AI_MODEL` for Google AI Studio, OpenRouter or any
compatible gateway. Free tiers are rate-limited, so the app's per-guest limit keeps
a demo from exhausting the quota.
