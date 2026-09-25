-- WEI (BDE) — 0001: extensions + tables
-- À exécuter en premier, sur un projet Supabase vide.

create extension if not exists pgcrypto;

-- ============================================================
-- Types
-- ============================================================

create type activity_type as enum ('activite', 'repas', 'transport', 'soiree', 'autre');
create type photo_submission_status as enum ('en_attente', 'validee', 'refusee');

-- ============================================================
-- Tables
-- ============================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  first_name text not null check (char_length(trim(first_name)) > 0),
  last_name text not null check (char_length(trim(last_name)) > 0),
  team_id uuid references teams (id) on delete set null,
  photo_path text,
  diet_notes text,
  created_at timestamptz not null default now()
);

create index participants_team_id_idx on participants (team_id);

create table organizers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table orga_pin_attempts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  attempts integer not null default 0,
  locked_until timestamptz
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location_name text,
  location_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type activity_type not null default 'activite',
  points_info text,
  menu text,
  created_at timestamptz not null default now(),
  constraint activities_time_chk check (ends_at > starts_at)
);

create index activities_starts_at_idx on activities (starts_at);

create table point_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants (id) on delete cascade,
  team_id uuid references teams (id) on delete cascade,
  amount integer not null,
  reason text not null check (char_length(trim(reason)) > 0),
  activity_id uuid references activities (id) on delete set null,
  given_by uuid not null references auth.users (id),
  cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint point_events_target_chk check (
    participant_id is not null or team_id is not null
  )
);

create index point_events_participant_id_idx on point_events (participant_id);
create index point_events_team_id_idx on point_events (team_id);
create index point_events_created_at_idx on point_events (created_at desc);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(trim(message)) > 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  pinned boolean not null default false
);

create index announcements_created_at_idx on announcements (created_at desc);

create table photo_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table photo_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references photo_challenges (id) on delete cascade,
  participant_id uuid not null references participants (id) on delete cascade,
  photo_path text not null,
  status photo_submission_status not null default 'en_attente',
  reviewed_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (challenge_id, participant_id)
);

create index photo_submissions_status_idx on photo_submissions (status);
create index photo_submissions_participant_id_idx on photo_submissions (participant_id);

-- Ligne de réglages unique (singleton).
create table settings (
  id boolean primary key default true,
  event_name text not null default 'WEI 2026',
  wei_code_hash text,
  orga_pin_hash text,
  start_date date,
  end_date date,
  address text,
  address_url text,
  transport_info text,
  checklist jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '[]'::jsonb,
  safety_contacts jsonb not null default '[]'::jsonb,
  site_map_path text,
  team_points_include_members boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint settings_singleton_chk check (id)
);

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- Ligne singleton : toujours présente, modifiée ensuite via update (jamais
-- ré-insérée), pour que les RPC/vues qui font `where id = true` trouvent
-- toujours une ligne.
insert into settings (id) values (true);
