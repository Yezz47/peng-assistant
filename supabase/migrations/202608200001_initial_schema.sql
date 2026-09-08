create extension if not exists pgcrypto;

create type merchant_status as enum ('active', 'inactive');
create type entry_type as enum ('nfc', 'qr', 'direct');

create table merchants (
  merchant_id text primary key check (merchant_id ~ '^[a-z0-9_-]{3,32}$'),
  name text not null check (char_length(name) between 1 and 50),
  branch_name text,
  category text not null,
  address text not null check (char_length(address) between 1 and 100),
  logo_url text,
  theme_color text not null default '#447A5B',
  status merchant_status not null default 'active',
  source text not null,
  updated_at timestamptz not null default now()
);

create table dishes (
  dish_id text primary key,
  merchant_id text not null references merchants(merchant_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  is_signature boolean not null default false,
  status merchant_status not null default 'active',
  sort_order integer not null default 0
);

create table sessions (
  session_id uuid primary key default gen_random_uuid(),
  merchant_id text not null references merchants(merchant_id),
  entry_type entry_type not null default 'direct',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_step text not null default 'merchant_open'
);

create table events (
  event_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,
  event_name text not null,
  event_result text,
  duration_ms integer,
  error_code text,
  created_at timestamptz not null default now()
);

create table feedback_samples (
  sample_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,
  merchant_id text not null references merchants(merchant_id),
  rating smallint not null check (rating between 1 and 5),
  selected_tags jsonb not null default '[]'::jsonb,
  selected_dish_ids jsonb not null default '[]'::jsonb,
  input_text_redacted text,
  generated_draft_redacted text,
  final_draft_redacted text,
  model_version text,
  validation_result jsonb,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create index dishes_merchant_sort_idx on dishes (merchant_id, sort_order);
create index events_session_created_idx on events (session_id, created_at);
create index feedback_samples_expiry_idx on feedback_samples (expires_at);

comment on table feedback_samples is 'Only insert when the consumer separately opts in to research retention.';
