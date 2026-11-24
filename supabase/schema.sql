-- Naila: Supabase schema.
-- Run once in the Supabase SQL editor (safe to re-run).
--
-- Each collection is a table of documents: `data` holds the object exactly as typed in
-- src/lib/types.ts, so new fields need no migration. src/lib/db.ts reads and writes these
-- tables through the REST API with the service-role key; uniqueness and lookups are covered
-- by the expression indexes below.
-- Files (videos, posters, music, transfer screenshots) live in Cloudflare R2; only their URLs are stored here.

do $$
declare t text;
begin
  foreach t in array array['events', 'guests', 'rsvps', 'wishes', 'views', 'templates',
                           'orders', 'change_requests', 'music', 'settings'] loop
    execute format(
      'create table if not exists public.%I (
         id         text primary key,
         data       jsonb not null,
         created_at timestamptz not null default now()
       )', t);
    -- Only our server (service role) talks to the database; RLS with no policies denies everyone else.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create unique index if not exists events_slug         on public.events ((data->>'slug'));
create unique index if not exists events_manage_token on public.events ((data->>'manageToken'));
create index        if not exists events_template     on public.events ((data->>'templateId'));

create unique index if not exists guests_token on public.guests ((data->>'token'));
create index        if not exists guests_event on public.guests ((data->>'eventId'));

-- Named guests have one reply each: their rsvp id is '{eventId}:{guestId}'.
create index if not exists rsvps_event on public.rsvps ((data->>'eventId'));
create index if not exists rsvps_guest on public.rsvps ((data->>'guestId'));

create index if not exists wishes_event on public.wishes ((data->>'eventId'));

create index if not exists views_event on public.views ((data->>'eventId'));
create index if not exists views_guest on public.views ((data->>'guestId'));

create index if not exists change_requests_event on public.change_requests ((data->>'eventId'));

-- Data retention (one year after the event) runs daily through /api/cron/retention (Vercel Cron).
