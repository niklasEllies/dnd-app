-- 0002: extensions + tables. Run first on a fresh Supabase DB.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz default now()
);

create table if not exists public.campaigns (
  id          uuid primary key default extensions.gen_random_uuid(),
  name        text not null,
  system      text,
  description text,
  dm_id       uuid not null references public.profiles(id),
  invite_code text unique default encode(extensions.gen_random_bytes(6), 'hex'),
  created_at  timestamptz default now()
);

create table if not exists public.campaign_members (
  id             uuid primary key default extensions.gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  role           text not null check (role in ('dm','player')),
  character_name text,
  joined_at      timestamptz default now(),
  unique (campaign_id, user_id)
);

create table if not exists public.sessions (
  id          uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  number      int,
  title       text,
  played_on   date,
  recap       text,
  created_by  uuid references public.profiles(id) default auth.uid(),
  created_at  timestamptz default now()
);

create table if not exists public.quotes (
  id          uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  body        text not null,
  speaker     text,
  visibility  text not null default 'shared' check (visibility in ('secret','shared')),
  created_by  uuid references public.profiles(id) default auth.uid(),
  created_at  timestamptz default now()
);

create table if not exists public.entities (
  id          uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  type        text not null check (type in ('npc','location','faction')),
  name        text not null,
  summary     text,
  notes       text,
  image_url   text,
  status      text check (status in ('alive','dead','unknown')),
  visibility  text not null default 'secret' check (visibility in ('secret','shared')),
  revealed_at timestamptz,
  created_by  uuid references public.profiles(id) default auth.uid(),
  created_at  timestamptz default now()
);

create table if not exists public.log_entries (
  id          uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  entity_id   uuid references public.entities(id) on delete set null,
  type        text not null check (type in ('reveal','death','decision','loot','milestone','note')),
  body        text not null,
  visibility  text not null default 'shared' check (visibility in ('secret','shared')),
  revealed_at timestamptz,
  created_by  uuid references public.profiles(id) default auth.uid(),
  created_at  timestamptz default now()
);

create table if not exists public.private_notes (
  id          uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  entity_id   uuid references public.entities(id) on delete set null,
  session_id  uuid references public.sessions(id) on delete set null,
  body        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);