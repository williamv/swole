-- Run this in your Supabase project's SQL editor

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  day_tag text not null,
  day_name text not null,
  date timestamptz not null default now(),
  is_complete boolean default false,
  week_number int not null,
  created_at timestamptz default now()
);

create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workout_sessions(id) on delete cascade,
  exercise_name text not null,
  display_order int not null,
  category text not null
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercise_logs(id) on delete cascade,
  set_number int not null,
  weight numeric not null default 0,
  reps int not null default 0,
  rpe numeric,
  is_complete boolean default false
);

-- Indexes for common queries
create index on workout_sessions (date desc);
create index on exercise_logs (workout_id);
create index on exercise_logs (exercise_name);
create index on set_logs (exercise_id);

-- If using RLS, disable it for a personal app with no auth:
-- alter table workout_sessions disable row level security;
-- alter table exercise_logs disable row level security;
-- alter table set_logs disable row level security;
