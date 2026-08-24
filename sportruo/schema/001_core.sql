-- SPORTRUO ONLY. DO NOT APPLY TO THE SHARED XEDRUO DATABASE.
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  xedruo_user_id uuid not null unique,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  display_name text not null,
  sport text not null,
  position text,
  country text,
  date_of_birth date,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  country text,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  country text,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  country text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete set null,
  name text not null,
  sport text not null,
  status text not null default 'draft',
  registration_open_at timestamptz,
  starts_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  capacity integer,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  xedruo_user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists talent_opportunities (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  sport text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists scouting_reports (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  scout_user_id uuid not null,
  summary text,
  rating numeric(4,2),
  created_at timestamptz not null default now()
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  from_club_id uuid references clubs(id) on delete set null,
  to_club_id uuid references clubs(id) on delete set null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists statistics (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  competition_id uuid references competitions(id) on delete cascade,
  metric text not null,
  value numeric not null,
  recorded_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete set null,
  venue_id uuid references venues(id) on delete set null,
  title text not null,
  starts_at timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists sponsorships (
  id uuid primary key default gen_random_uuid(),
  sponsor_name text not null,
  entity_type text not null,
  entity_id uuid,
  status text not null default 'prospect',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  xedruo_user_id uuid not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_xedruo_user on profiles(xedruo_user_id);
create index if not exists idx_registrations_user on registrations(xedruo_user_id);
create index if not exists idx_notifications_user on notifications(xedruo_user_id);
create index if not exists idx_stats_athlete on statistics(athlete_id);
create index if not exists idx_opportunities_status on talent_opportunities(status);
