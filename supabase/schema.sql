-- ---------------------------------------------------------------------------
-- Airbnb AI Concierge — Supabase schema
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before setting
-- SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
--
-- Security model:
--   * Guests are unauthenticated. Their flows run in server routes using the
--     service-role key, scoped by a signed guest-session cookie.
--   * Hosts authenticate with Supabase Auth. Every host query uses the user's
--     own client, so the Row Level Security policies below are the final gate.
--   * The service-role key is never exposed to the browser.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ PROFILES
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null default '',
  role text not null default 'host' check (role in ('host', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- PROPERTIES
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null default '',
  neighbourhood text not null default '',
  city text not null default '',
  description text not null default '',
  host_name text not null default '',
  host_phone text not null default '',
  host_email text not null default '',
  check_in text not null default '15:00',
  check_out text not null default '11:00',
  check_in_instructions text not null default '',
  check_out_instructions text not null default '',
  wifi_name text not null default '',
  wifi_password text not null default '',
  house_rules jsonb not null default '[]'::jsonb,
  amenities jsonb not null default '[]'::jsonb,
  appliance_instructions jsonb not null default '[]'::jsonb,
  emergency_information text not null default '',
  faqs jsonb not null default '[]'::jsonb,
  settings jsonb not null default
    '{"tone":"warm","extraInstructions":"","servicePreferences":"","escalationInstructions":""}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_host_idx on public.properties(host_id);

-- ------------------------------------------------------------ GUEST SESSIONS
create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_name text not null default 'Guest',
  check_in_date date not null,
  check_out_date date not null,
  preferences jsonb not null default
    '{"interests":[],"notes":"","consent":false}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists guest_sessions_property_idx
  on public.guest_sessions(property_id);

-- ------------------------------------------------------------- CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  guest_session_id uuid not null unique references public.guest_sessions(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  summary text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists conversations_property_idx
  on public.conversations(property_id, last_message_at desc);

-- ------------------------------------------------------------------- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tool_events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx
  on public.messages(conversation_id, created_at);

-- --------------------------------------------------------- MAINTENANCE
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_session_id uuid references public.guest_sessions(id) on delete set null,
  guest_name text not null default 'Guest',
  description text not null,
  category text not null default 'maintenance'
    check (category in ('maintenance', 'assistance', 'service')),
  priority text not null default 'normal'
    check (priority in ('urgent', 'high', 'normal', 'low')),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved')),
  urgency_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists maintenance_property_idx
  on public.maintenance_requests(property_id, created_at desc);
create index if not exists maintenance_status_idx
  on public.maintenance_requests(status);

-- -------------------------------------------------------------- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  message text not null,
  type text not null default 'system'
    check (type in ('maintenance', 'message', 'service', 'system')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_host_idx
  on public.notifications(host_id, created_at desc);

-- ------------------------------------------------------------------ TRIGGER
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_touch_updated_at on public.properties;
create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();

drop trigger if exists maintenance_touch_updated_at on public.maintenance_requests;
create trigger maintenance_touch_updated_at
  before update on public.maintenance_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.notifications enable row level security;

-- Profiles: a host can see and update only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Properties: full control for the owning host only.
drop policy if exists "properties_select_own" on public.properties;
create policy "properties_select_own" on public.properties
  for select using (host_id = auth.uid());

drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own" on public.properties
  for insert with check (host_id = auth.uid());

drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own" on public.properties
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own" on public.properties
  for delete using (host_id = auth.uid());

-- Guest sessions: read-only for the host who owns the property.
drop policy if exists "guest_sessions_select_owned" on public.guest_sessions;
create policy "guest_sessions_select_owned" on public.guest_sessions
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = guest_sessions.property_id and p.host_id = auth.uid()
    )
  );

-- Conversations: read-only for the owning host.
drop policy if exists "conversations_select_owned" on public.conversations;
create policy "conversations_select_owned" on public.conversations
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = conversations.property_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "conversations_update_owned" on public.conversations;
create policy "conversations_update_owned" on public.conversations
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = conversations.property_id and p.host_id = auth.uid()
    )
  );

-- Messages: read-only for the owning host.
drop policy if exists "messages_select_owned" on public.messages;
create policy "messages_select_owned" on public.messages
  for select using (
    exists (
      select 1
      from public.conversations c
      join public.properties p on p.id = c.property_id
      where c.id = messages.conversation_id and p.host_id = auth.uid()
    )
  );

-- Maintenance: the owning host reads and updates status.
drop policy if exists "maintenance_select_owned" on public.maintenance_requests;
create policy "maintenance_select_owned" on public.maintenance_requests
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "maintenance_update_owned" on public.maintenance_requests;
create policy "maintenance_update_owned" on public.maintenance_requests
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.host_id = auth.uid()
    )
  );

-- Notifications: the host who received them.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (host_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());

-- ------------------------------------------------------------------ COMMENTS
comment on table public.properties is
  'The verified property record. The AI concierge answers property questions only from these rows.';
comment on table public.guest_sessions is
  'Unauthenticated guest stays, scoped by a signed server-side cookie. Accessed by server routes only.';
