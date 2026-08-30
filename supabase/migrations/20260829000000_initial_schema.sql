create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- create table public.companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  company_type text,
  company_size text,
  location text,
  description text,
  website_url text,
  careers_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists companies_name_unique
  on public.companies (lower(trim(name)));

-- create table public.jobs
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  title text not null,
  job_direction text,
  industry text,
  location text,
  published_at timestamptz,
  first_discovered_at timestamptz not null default timezone('utc', now()),
  source_name text not null,
  source_url text not null,
  official_url text,
  status text not null default 'unknown' check (status in ('active', 'closed', 'unknown')),
  source_job_id text,
  source_urls jsonb not null default '[]'::jsonb,
  dedupe_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- create table public.crawl_logs
create table if not exists public.crawl_logs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default timezone('utc', now()),
  status text not null check (status in ('running', 'success', 'partial_failure', 'failed')),
  discovered_job_count integer not null default 0,
  new_job_count integer not null default 0,
  new_company_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

-- create unique index jobs_official_url_unique
create unique index if not exists jobs_official_url_unique
  on public.jobs (official_url)
  where official_url is not null;

-- create unique index jobs_source_job_id_unique
create unique index if not exists jobs_source_job_id_unique
  on public.jobs (source_name, source_job_id)
  where source_job_id is not null;

create index if not exists jobs_dedupe_key_index on public.jobs (dedupe_key);
create index if not exists jobs_first_discovered_at_index on public.jobs (first_discovered_at desc);
create index if not exists jobs_published_at_index on public.jobs (published_at desc);
create index if not exists jobs_job_direction_index on public.jobs (job_direction);
create index if not exists jobs_industry_index on public.jobs (industry);
create index if not exists jobs_location_index on public.jobs (location);

alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.crawl_logs enable row level security;

drop policy if exists "anon_can_read_companies" on public.companies;
create policy "anon_can_read_companies"
on public.companies for select to anon
using (true);

drop policy if exists "anon_can_read_jobs" on public.jobs;
create policy "anon_can_read_jobs"
on public.jobs for select to anon
using (true);
