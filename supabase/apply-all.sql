-- ---------------------------------------------------------------------------
-- Airbnb AI Concierge — the one additive migration that is still required.
--
-- Run this once in the Supabase SQL editor after supabase/schema.sql. It is
-- idempotent (create ... if not exists, drop policy if exists), so re-running it
-- is safe and changes nothing that already exists.
--
-- The guest plan is NOT here: it is stored in guest_sessions.preferences, a
-- jsonb column that already exists in every deployment, so it needs no schema
-- change at all.
-- ---------------------------------------------------------------------------

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_session_id uuid references public.guest_sessions(id) on delete set null,
  guest_name text not null,
  guest_email text not null default '',
  check_in_date date not null,
  check_out_date date not null,
  guests integer not null default 2 check (guests between 1 and 30),
  status text not null default 'upcoming'
    check (status in ('upcoming', 'in_house', 'completed', 'cancelled')),
  -- 'airbnb' is reserved for rows written by an authorised integration.
  source text not null default 'manual'
    check (source in ('airbnb', 'manual', 'demo')),
  external_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_dates_check check (check_out_date >= check_in_date)
);
create index if not exists reservations_property_idx
  on public.reservations(property_id, check_in_date);
create index if not exists reservations_guest_session_idx
  on public.reservations(guest_session_id);

drop trigger if exists reservations_touch_updated_at on public.reservations;
create trigger reservations_touch_updated_at
  before update on public.reservations
  for each row execute function public.touch_updated_at();

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'airbnb' check (provider in ('airbnb')),
  status text not null default 'not_connected'
    check (status in ('not_connected', 'demo', 'pending_verification', 'connected', 'error')),
  mode text not null default 'oauth' check (mode in ('oauth', 'manual', 'demo')),
  account_ref text not null default '',
  credentials jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text not null default '',
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_id, provider)
);

drop trigger if exists integrations_touch_updated_at on public.integrations;
create trigger integrations_touch_updated_at
  before update on public.integrations
  for each row execute function public.touch_updated_at();

alter table public.reservations enable row level security;
alter table public.integrations enable row level security;

drop policy if exists "reservations_select_owned" on public.reservations;
create policy "reservations_select_owned" on public.reservations
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = reservations.property_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "reservations_insert_owned" on public.reservations;
create policy "reservations_insert_owned" on public.reservations
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = reservations.property_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "reservations_update_owned" on public.reservations;
create policy "reservations_update_owned" on public.reservations
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = reservations.property_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "integrations_select_own" on public.integrations;
create policy "integrations_select_own" on public.integrations
  for select using (host_id = auth.uid());

comment on table public.reservations is
  'Stays that the concierge can answer from. source = demo/manual here; airbnb rows are reserved for an authorised integration.';
comment on table public.integrations is
  'External connection records. Credentials are service-role only and never sent to the browser.';
