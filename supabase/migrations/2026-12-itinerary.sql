-- ---------------------------------------------------------------------------
-- Guest itinerary
--
-- Apply this after supabase/schema.sql (and alongside the reservations
-- migration). Purely additive: it creates one table, its indexes, a trigger and
-- a read policy for the owning host. Existing rows are untouched.
--
-- Until it runs, /itinerary and the concierge's plan tools show a migration
-- notice instead of failing, and the rest of the app keeps working.
-- ---------------------------------------------------------------------------

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  guest_session_id uuid not null references public.guest_sessions(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  -- 1 = check-in day.
  day integer not null check (day between 1 and 14),
  slot text not null check (slot in ('morning', 'afternoon', 'evening')),
  title text not null,
  -- Id from the curated guide when the stop came from it; free-text stops leave
  -- this null. It is never a booking reference or an Airbnb identifier.
  place_id text,
  notes text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_guest_idx
  on public.itinerary_items(guest_session_id, day, slot);
create index if not exists itinerary_property_idx
  on public.itinerary_items(property_id);

drop trigger if exists itinerary_touch_updated_at on public.itinerary_items;
create trigger itinerary_touch_updated_at
  before update on public.itinerary_items
  for each row execute function public.touch_updated_at();

alter table public.itinerary_items enable row level security;

-- Hosts can read the plans for their own properties (for the guest profile
-- view). Guests never query this table directly: every guest read and write
-- goes through a server route scoped by the signed guest cookie.
drop policy if exists "itinerary_select_owned" on public.itinerary_items;
create policy "itinerary_select_owned" on public.itinerary_items
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = itinerary_items.property_id and p.host_id = auth.uid()
    )
  );

comment on table public.itinerary_items is
  'A guest''s saved day-by-day plan. Scoped to one guest session; written only by server routes and the concierge tools.';
