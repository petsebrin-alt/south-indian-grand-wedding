-- RSVPs and Wishing Wall storage (PRD §13).
-- Browsers never read or write these tables directly: Row-Level Security is on with no
-- policies for anon/authenticated users, so all access goes through the Edge Functions,
-- which validate, rate-limit and use the service role.

create extension if not exists pgcrypto;

create type public.attendance as enum ('accept', 'decline');
create type public.wish_status as enum ('pending', 'approved', 'rejected');

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  guest_name text not null check (char_length(guest_name) between 2 and 80),
  attendance public.attendance not null,
  attendee_count integer not null check (attendee_count between 0 and 20),
  events text[] not null default '{}',
  dietary text[] not null default '{}',
  dietary_note text check (dietary_note is null or char_length(dietary_note) <= 200),
  message text check (message is null or char_length(message) <= 500),
  consent boolean not null check (consent),
  edit_token_hash text not null,
  idempotency_key text not null unique,
  ip_hash text not null,
  check ((attendance = 'accept' and attendee_count >= 1) or (attendance = 'decline' and attendee_count = 0))
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 60),
  message text not null check (char_length(message) between 5 and 500),
  status public.wish_status not null default 'pending',
  moderated_at timestamptz,
  moderated_by text,
  idempotency_key text not null unique,
  ip_hash text not null
);

create index wishes_status_created_idx on public.wishes (status, created_at desc);

-- Rate limiting (5 per hour per hashed address per form)
create table public.submission_events (
  id bigserial primary key,
  kind text not null check (kind in ('rsvp', 'wish')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index submission_events_lookup_idx on public.submission_events (kind, ip_hash, created_at);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger rsvps_touch_updated_at before update on public.rsvps for each row execute function public.touch_updated_at();

alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.submission_events enable row level security;
-- No policies on purpose: anon and authenticated roles have no access.

revoke all on public.rsvps, public.wishes, public.submission_events from anon, authenticated;

-- Data retention (PRD §13.8, Q-E6 default): remove guest data six months after the wedding.
create function public.purge_guest_data(cutoff date default date '2027-10-07') returns void language sql as $$
  delete from public.rsvps where now() >= cutoff;
  delete from public.wishes where now() >= cutoff;
  delete from public.submission_events where created_at < now() - interval '2 days';
$$;

revoke all on function public.purge_guest_data(date) from public, anon, authenticated;
