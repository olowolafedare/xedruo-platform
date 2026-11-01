-- Central Xedruo Identity foundation.
-- Safe additive migration: does not delete, rewrite, or merge existing user rows.
-- IDs are permanent. KYC controls regulated feature access, never ID existence.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.xedruo_identity (
  user_id uuid primary key references auth.users(id) on delete restrict,
  xedruo_id text not null unique,
  country_code char(2) not null,
  status text not null default 'unverified'
    check (status in ('unverified','verified','suspended')),
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started','pending','verified','rejected','review_required')),
  kyc_level integer not null default 0 check (kyc_level >= 0),
  phone_e164 text,
  phone_verified_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xedruo_identity_id_format check (
    xedruo_id ~ '^Xedruo [A-Z]{2} [0-9]{10}$'
  ),
  constraint xedruo_identity_country_prefix check (
    substring(xedruo_id from 8 for 2) = country_code
  )
);

create index if not exists xedruo_identity_country_idx
  on public.xedruo_identity(country_code);

create table if not exists public.xedruo_company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  xedruo_id text not null references public.xedruo_identity(xedruo_id) on update cascade on delete restrict,
  company_slug text not null check (company_slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  display_name text,
  avatar_url text,
  bio text,
  company_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, company_slug),
  unique(company_slug, xedruo_id)
);

create index if not exists xedruo_company_profiles_user_idx
  on public.xedruo_company_profiles(user_id);
create index if not exists xedruo_company_profiles_slug_idx
  on public.xedruo_company_profiles(company_slug);

alter table public.xedruo_identity enable row level security;
alter table public.xedruo_company_profiles enable row level security;

drop policy if exists "Users read own Xedruo identity" on public.xedruo_identity;
create policy "Users read own Xedruo identity"
  on public.xedruo_identity for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users read own company profiles" on public.xedruo_company_profiles;
create policy "Users read own company profiles"
  on public.xedruo_company_profiles for select to authenticated
  using (user_id = auth.uid());

revoke all on public.xedruo_identity from anon, authenticated;
revoke all on public.xedruo_company_profiles from anon, authenticated;
grant select on public.xedruo_identity to authenticated;
grant select on public.xedruo_company_profiles to authenticated;

-- Allocate an ID in the database, not in browser JavaScript.
-- Existing identities are returned unchanged; country cannot be silently changed.
create or replace function public.ensure_xedruo_identity(p_country_code text)
returns table(xedruo_id text, country_code char(2), status text, kyc_status text, created boolean)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_country char(2) := upper(trim(p_country_code))::char(2);
  v_candidate text;
  v_inserted boolean := false;
  v_attempt integer := 0;
  v_row public.xedruo_identity%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'Select a valid two-letter country code' using errcode = '22023';
  end if;

  select * into v_row
  from public.xedruo_identity i
  where i.user_id = v_user_id;

  if found then
    return query select v_row.xedruo_id, v_row.country_code, v_row.status, v_row.kyc_status, false;
    return;
  end if;

  loop
    v_attempt := v_attempt + 1;
    -- 60 random UUID bits are reduced to a zero-padded 10-digit decimal suffix.
    v_candidate := 'Xedruo ' || v_country || ' ' ||
      lpad((((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 15))::bit(60)::bigint
        % 9000000000) + 1000000000)::text), 10, '0');

    begin
      insert into public.xedruo_identity(user_id, xedruo_id, country_code)
      values (v_user_id, v_candidate, v_country)
      returning * into v_row;
      v_inserted := true;
      exit;
    exception when unique_violation then
      if exists (select 1 from public.xedruo_identity where user_id = v_user_id) then
        select * into v_row from public.xedruo_identity where user_id = v_user_id;
        exit;
      end if;
      if v_attempt >= 20 then
        raise exception 'Unable to allocate a unique Xedruo ID; retry later';
      end if;
    end;
  end loop;

  return query select v_row.xedruo_id, v_row.country_code, v_row.status, v_row.kyc_status, v_inserted;
end;
$$;

-- Each product calls this after central authentication. Its profile remains
-- separate from every other product profile and can only be created for self.
create or replace function public.ensure_xedruo_company_profile(
  p_company_slug text,
  p_display_name text default null
)
returns public.xedruo_company_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_identity public.xedruo_identity%rowtype;
  v_profile public.xedruo_company_profiles%rowtype;
  v_slug text := lower(trim(p_company_slug));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' then
    raise exception 'Invalid company slug' using errcode = '22023';
  end if;

  select * into v_identity from public.xedruo_identity where user_id = v_user_id;
  if not found then
    raise exception 'Create the central Xedruo identity first';
  end if;

  insert into public.xedruo_company_profiles(user_id, xedruo_id, company_slug, display_name)
  values (v_user_id, v_identity.xedruo_id, v_slug, nullif(trim(p_display_name), ''))
  on conflict (user_id, company_slug) do update
    set display_name = coalesce(excluded.display_name, public.xedruo_company_profiles.display_name),
        updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.ensure_xedruo_identity(text) from public, anon;
grant execute on function public.ensure_xedruo_identity(text) to authenticated;
revoke all on function public.ensure_xedruo_company_profile(text, text) from public, anon;
grant execute on function public.ensure_xedruo_company_profile(text, text) to authenticated;

comment on table public.xedruo_identity is
  'Permanent central identity registry. KYC state does not expire or delete the identity.';
comment on table public.xedruo_company_profiles is
  'Independent profile per Xedruo company, linked to the permanent central Xedruo ID.';
