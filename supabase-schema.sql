-- Run this in your Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pin_hash text not null
);

create table if not exists budget_periods (
  id uuid primary key default gen_random_uuid(),
  start_date date not null unique,
  end_date date not null
);

create table if not exists budget_config (
  category text primary key,
  budget_amount numeric(10,2) not null
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references budget_periods(id),
  category text not null references budget_config(category),
  amount numeric(10,2) not null,
  description text,
  spend_date date not null,
  logged_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_period_idx on transactions (period_id);
create index if not exists transactions_spend_date_idx on transactions (spend_date);

-- Seed category budgets
insert into budget_config (category, budget_amount) values
  ('food', 400.00),
  ('petrol', 400.00),
  ('adhoc', 650.00)
on conflict (category) do nothing;

-- Seed first pay period
insert into budget_periods (start_date, end_date) values ('2026-07-04', '2026-08-01')
on conflict (start_date) do nothing;

-- ============================================================
-- Insert Ryan and Emily's user records.
-- Replace each pin_hash with the output of: node scripts/hash-pin.mjs <pin>
-- ============================================================
-- insert into users (username, pin_hash) values ('ryan', '$2b$10$PASTE_HASH_HERE');
-- insert into users (username, pin_hash) values ('emily', '$2b$10$PASTE_HASH_HERE');

-- Row level security (data is shared + server-side auth enforces access;
-- app uses the service role key, which bypasses RLS)
alter table transactions disable row level security;
alter table budget_periods disable row level security;
alter table budget_config disable row level security;

-- Deny all direct anon-key access to users. No policy = no access for anon role.
alter table users enable row level security;
