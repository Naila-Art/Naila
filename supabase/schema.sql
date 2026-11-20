-- Digital Invitations — Supabase schema (draft).
-- Mirrors src/lib/types.ts. The local JSON store (src/lib/store.ts) is replaced by queries on these tables.
-- Guest-facing reads/writes go through our server (service role), so RLS denies everything to anon by default.

create extension if not exists "pgcrypto";

create table clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  phone         text,
  -- Password-free access link: /c/{private_token}
  private_token text not null unique default encode(gen_random_bytes(18), 'base64url'),
  created_at    timestamptz not null default now()
);

create table templates (
  id          text primary key,                -- e.g. 'ivory-seal'
  name        text not null,
  category    text not null check (category in ('wedding', 'engagement', 'katb_kitab')),
  video_url   text,
  poster_url  text,
  theme       jsonb not null,                  -- { background, surface, text, accent, seal }
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table orders (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id),
  template_id     text not null references templates(id),
  package         smallint not null check (package between 1 and 4),
  addons          text[] not null default '{}',
  total_egp       integer not null,
  status          text not null default 'new'
                  check (status in ('new', 'brief', 'design', 'draft', 'approved', 'live', 'done')),
  payment_status  text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  created_at      timestamptz not null default now()
);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id),
  provider    text not null check (provider in ('paymob', 'instapay')),
  amount_egp  integer not null,
  reference   text,                            -- Paymob transaction id
  proof_url   text,                            -- Instapay screenshot
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at  timestamptz not null default now()
);

create table events (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references orders(id),
  slug           text not null unique,
  template_id    text not null references templates(id),
  lang           text not null default 'ar' check (lang in ('ar', 'en')),
  partner_a      text not null,
  partner_b      text not null,
  date           timestamptz not null,
  venue_name     text not null,
  venue_address  text,
  maps_url       text,
  music_url      text,
  general_text   text not null,
  personal_text  text not null,               -- supports {title} {name}
  created_at     timestamptz not null default now()
);

-- Optional: with no guests, the invitation is general.
create table guests (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(8), 'hex'),
  title       text,
  name        text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

create table guest_views (
  id          bigserial primary key,
  event_id    uuid not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete cascade,
  opened_at   timestamptz not null default now(),
  user_agent  text
);

create table rsvps (
  id          bigserial primary key,
  event_id    uuid not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete cascade,
  name        text not null,
  status      text not null check (status in ('attending', 'declined')),
  created_at  timestamptz not null default now()
);
-- One reply per named guest (general-link replies have guest_id null and are not limited).
create unique index rsvps_one_per_guest on rsvps (guest_id) where guest_id is not null;

create table wishes (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  guest_id    uuid references guests(id) on delete set null,
  name        text not null,
  body        text not null check (char_length(body) <= 500),
  created_at  timestamptz not null default now()
);

create index on guests (event_id);
create index on guest_views (event_id);
create index on rsvps (event_id);
create index on wishes (event_id);

alter table clients     enable row level security;
alter table templates   enable row level security;
alter table orders      enable row level security;
alter table payments    enable row level security;
alter table events      enable row level security;
alter table guests      enable row level security;
alter table guest_views enable row level security;
alter table rsvps       enable row level security;
alter table wishes      enable row level security;

-- Data retention (decision: one year after the event). Run daily via pg_cron:
-- delete from guests where event_id in (select id from events where date < now() - interval '1 year');
