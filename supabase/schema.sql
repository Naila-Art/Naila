-- Digital Invitations: Supabase schema (draft).
-- Mirrors src/lib/types.ts. The local JSON store (src/lib/store.ts) is replaced by queries on these tables.
-- Everything goes through our server (service role), so RLS denies everything to anon by default.
-- Files (videos, posters, music, transfer screenshots) live in Cloudflare R2; only their URLs are stored here.

create extension if not exists "pgcrypto";

create table templates (
  id          text primary key,                -- 'tpl_' + 10 hex, or 'ivory-seal' (built-in)
  name        text not null,
  category    text not null check (category in ('wedding', 'engagement', 'katb_kitab')),
  video_url   text,
  poster_url  text,
  theme       jsonb not null,                  -- { background, surface, text, accent, seal }
  family      text not null default 'envelope' check (family in ('envelope', 'doors')),
  end_poster_url text,                         -- last frame of the video (doors family)
  ambient_url text,                            -- blurred last frame, desktop backdrop
  reveal_at_ms integer,                        -- when the names appear over the opening
  scene jsonb,                                 -- doors family: {skyTop, skyWidth, reflectionTop, ink}
  created_at  timestamptz not null default now()
);

create table music_tracks (
  id          text primary key,                -- 'trk_' + 10 hex
  name        text not null,
  url         text not null,
  created_at  timestamptz not null default now()
);

-- One order per invitation. "self" = built in the storefront (packages 1-2); "custom" = a request for 3-4.
-- The client is identified by name + WhatsApp number (no accounts, no passwords).
create table orders (
  id                     text primary key,      -- 'ord_' + 10 hex
  kind                   text not null check (kind in ('self', 'custom')),
  client_name            text not null,
  client_phone           text not null,         -- +20...
  package                smallint not null check (package between 1 and 4),
  addons                 jsonb not null,        -- { arabic, maps, customMusic, names: '100'|'300'|'unlimited'|null }
  total_egp              integer not null,
  payment                text not null default 'unpaid' check (payment in ('unpaid', 'pending_review', 'paid')),
  payment_method         text check (payment_method in ('paymob', 'instapay', 'manual')),
  proof_url              text,                  -- Instapay screenshot (R2)
  reject_reason          text,
  paid_at                timestamptz,
  paymob_transaction_id  text unique,
  stage                  text check (stage in ('new', 'contacted', 'in_design', 'delivered')),
  brief                  jsonb,                 -- custom requests: { category, date, notes }
  cancelled_at           timestamptz,           -- cancelled / refunded: every link of the event closes
  cancel_reason          text,
  refunded               boolean not null default false,
  created_at             timestamptz not null default now()
);
create index on orders (client_phone);
create index on orders (paid_at);

create table events (
  id              text primary key,             -- 'evt_' + 10 hex
  order_id        text references orders(id),
  slug            text not null unique,
  -- Password-free access link for the client: /c/{manage_token}
  manage_token    text not null unique,
  status          text not null default 'draft' check (status in ('draft', 'active', 'cancelled')),
  template_id     text not null references templates(id),
  category        text check (category in ('wedding', 'engagement', 'katb_kitab')),
  lang            text not null default 'ar' check (lang in ('ar', 'en')),
  partner_a       text not null,
  partner_b       text not null,
  date            timestamptz not null,
  venue_name      text not null,
  venue_address   text,
  maps_url        text,
  music_track_id  text references music_tracks(id) on delete set null,
  music_url       text,                         -- client's own song (R2)
  general_text    text not null,
  personal_text   text not null,                -- supports {title} {name}
  schedule        jsonb,                        -- [{ time: '19:00', label: 'Katb kitab' }, ...]
  dress_code      text,
  notes           text,
  created_at      timestamptz not null default now()
);

create table change_requests (
  id           text primary key,
  event_id     text not null references events(id) on delete cascade,
  body         text not null check (char_length(body) <= 1000),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- Optional: with no guests, the invitation is general.
create table guests (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null references events(id) on delete cascade,
  token       text not null unique,
  title       text,
  name        text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

create table guest_views (
  id          bigserial primary key,
  event_id    text not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete cascade,
  opened_at   timestamptz not null default now(),
  user_agent  text
);

create table rsvps (
  id          bigserial primary key,
  event_id    text not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete cascade,
  name        text not null,
  status      text not null check (status in ('attending', 'declined')),
  created_at  timestamptz not null default now()
);
-- One reply per named guest (general-link replies have guest_id null and are not limited).
create unique index rsvps_one_per_guest on rsvps (guest_id) where guest_id is not null;

create table wishes (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete set null,
  name        text not null,
  body        text not null check (char_length(body) <= 500),
  created_at  timestamptz not null default now()
);

create index on guests (event_id);
create index on guest_views (event_id);
create index on rsvps (event_id);
create index on wishes (event_id);

alter table templates       enable row level security;
alter table music_tracks    enable row level security;
alter table orders          enable row level security;
alter table events          enable row level security;
alter table change_requests enable row level security;
alter table guests          enable row level security;
alter table guest_views     enable row level security;
alter table rsvps           enable row level security;
alter table wishes          enable row level security;

-- Data retention (decision: one year after the event). The app runs it daily through
-- /api/cron/retention (Vercel Cron); the equivalent SQL is:
-- delete from guests      where event_id in (select id from events where date < now() - interval '1 year');
-- delete from rsvps       where event_id in (select id from events where date < now() - interval '1 year');
-- delete from wishes      where event_id in (select id from events where date < now() - interval '1 year');
-- delete from guest_views where event_id in (select id from events where date < now() - interval '1 year');
