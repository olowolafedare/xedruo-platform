-- Central Xedruo Identity foundation.
-- Privileged implementation functions live in a non-exposed schema. Public RPCs below are invoker wrappers.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

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
create or replace function private.ensure_xedruo_identity(p_country_code text)
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
create or replace function private.ensure_xedruo_company_profile(
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

revoke all on function private.ensure_xedruo_identity(text) from public, anon;
grant execute on function private.ensure_xedruo_identity(text) to authenticated;
revoke all on function private.ensure_xedruo_company_profile(text, text) from public, anon;
grant execute on function private.ensure_xedruo_company_profile(text, text) to authenticated;

comment on table public.xedruo_identity is
  'Permanent central identity registry. KYC state does not expire or delete the identity.';
comment on table public.xedruo_company_profiles is
  'Independent profile per Xedruo company, linked to the permanent central Xedruo ID.';

-- Enforce the permanence rule even for privileged maintenance paths:
-- identity number and original issuing country cannot be changed or deleted.
create or replace function public.prevent_xedruo_identity_reassignment()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'A permanent Xedruo identity cannot be deleted or reassigned';
  end if;
  if new.xedruo_id is distinct from old.xedruo_id
     or new.country_code is distinct from old.country_code
     or new.user_id is distinct from old.user_id then
    raise exception 'A permanent Xedruo identity number and issuing country cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists xedruo_identity_permanent_guard on public.xedruo_identity;
create trigger xedruo_identity_permanent_guard
before update or delete on public.xedruo_identity
for each row execute function public.prevent_xedruo_identity_reassignment();


-- Server-authoritative ISO country to E.164 calling-code map, sourced from the existing app dataset.
create table if not exists public.xedruo_country_calling_codes (
  country_code char(2) primary key,
  calling_code text not null check (calling_code ~ '^\\+[1-9][0-9]{0,3}
-- intentionally deferred. A phone number is not marked verified until a
-- future OTP challenge succeeds.
create or replace function private.set_xedruo_identity_phone(
  p_country_code text,
  p_phone_e164 text
)
returns table(xedruo_id text, country_code char(2), phone_e164 text, phone_verified_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_country char(2) := upper(trim(p_country_code))::char(2);
  v_identity public.xedruo_identity%rowtype;
  v_calling_code text;
  v_phone text := regexp_replace(trim(p_phone_e164), '[^+0-9]', '', 'g');
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'Select a valid two-letter country code' using errcode = '22023';
  end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Enter a valid international phone number in E.164 format' using errcode = '22023';
  end if;

  select * into v_identity
  from public.xedruo_identity
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Create the central Xedruo identity before saving its phone number';
  end if;
  if v_identity.country_code <> v_country then
    raise exception 'The original issuing country is permanent and cannot be changed';
  end if;

  update public.xedruo_identity
  set phone_e164 = v_phone, updated_at = now()
  where user_id = v_user_id
  returning * into v_identity;

  return query select v_identity.xedruo_id, v_identity.country_code, v_identity.phone_e164, v_identity.phone_verified_at;
end;
$$;

revoke all on function private.set_xedruo_identity_phone(text, text) from public, anon;
grant execute on function private.set_xedruo_identity_phone(text, text) to authenticated;


-- PostgREST-facing RPCs are SECURITY INVOKER only. They delegate to private,
-- auth.uid()-guarded SECURITY DEFINER implementations.
create or replace function public.ensure_xedruo_identity(p_country_code text)
returns table(xedruo_id text, country_code char(2), status text, kyc_status text, created boolean)
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select * from private.ensure_xedruo_identity(p_country_code); $$;

create or replace function public.ensure_xedruo_company_profile(
  p_company_slug text,
  p_display_name text default null
)
returns public.xedruo_company_profiles
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.ensure_xedruo_company_profile(p_company_slug, p_display_name); $$;

create or replace function public.set_xedruo_identity_phone(
  p_country_code text,
  p_phone_e164 text
)
returns table(xedruo_id text, country_code char(2), phone_e164 text, phone_verified_at timestamptz)
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select * from private.set_xedruo_identity_phone(p_country_code, p_phone_e164); $$;

revoke all on function public.ensure_xedruo_identity(text) from public, anon;
grant execute on function public.ensure_xedruo_identity(text) to authenticated;
revoke all on function public.ensure_xedruo_company_profile(text, text) from public, anon;
grant execute on function public.ensure_xedruo_company_profile(text, text) to authenticated;
revoke all on function public.set_xedruo_identity_phone(text, text) from public, anon;
grant execute on function public.set_xedruo_identity_phone(text, text) to authenticated;


-- Durable notification foundation. The outbox contains identity metadata only;
-- phone numbers, OTPs, access tokens, and Google credentials are never queued.
create table if not exists public.xedruo_company_app_registry (
  company_slug text primary key check (company_slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  display_name text not null,
  app_origin text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.xedruo_company_app_registry(company_slug, display_name)
values
  ('xedruo', 'Xedruo'),
  ('xedrion-ai', 'Xedrion AI'),
  ('sportruo', 'Sportruo'),
  ('healthruo', 'Healthruo'),
  ('spacetruo', 'SpaceTruo'),
  ('hireuo', 'Hireuo'),
  ('xedruo-properties', 'Xedruo Properties'),
  ('xedruo-music', 'Xedruo Music'),
  ('pay-and-play', 'Pay & Play'),
  ('adom-global-commerce', 'Adom Global Commerce'),
  ('xedruo-global-logistics', 'Xedruo Global Logistics')
on conflict (company_slug) do update
  set display_name = excluded.display_name,
      updated_at = now();

create table if not exists public.xedruo_identity_event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('identity.created')),
  user_id uuid not null references auth.users(id) on delete restrict,
  xedruo_id text not null references public.xedruo_identity(xedruo_id) on update cascade on delete restrict,
  issuing_country char(2) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  processed_at timestamptz,
  last_error text
);

create index if not exists xedruo_identity_outbox_pending_idx
  on public.xedruo_identity_event_outbox(available_at, created_at)
  where processed_at is null;

alter table public.xedruo_company_app_registry enable row level security;
alter table public.xedruo_identity_event_outbox enable row level security;
revoke all on public.xedruo_company_app_registry from public, anon, authenticated;
revoke all on public.xedruo_identity_event_outbox from public, anon, authenticated;

create or replace function private.enqueue_xedruo_identity_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.xedruo_identity_event_outbox(
    event_type, user_id, xedruo_id, issuing_country, payload
  )
  values (
    'identity.created',
    new.user_id,
    new.xedruo_id,
    new.country_code,
    jsonb_build_object('event_version', 1)
  );
  return new;
end;
$$;

drop trigger if exists xedruo_identity_created_outbox on public.xedruo_identity;
create trigger xedruo_identity_created_outbox
after insert on public.xedruo_identity
for each row execute function private.enqueue_xedruo_identity_created();


-- Browser push subscription storage. Subscription endpoints and encryption keys
-- are private delivery credentials: clients can only register/remove their own.
create table if not exists public.xedruo_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_slug text not null default 'xedruo'
    references public.xedruo_company_app_registry(company_slug) on update cascade on delete restrict,
  endpoint text not null check (endpoint ~ '^https://'),
  p256dh text not null check (length(p256dh) between 40 and 256),
  auth text not null check (length(auth) between 16 and 128),
  user_agent text,
  active boolean not null default true,
  expiration_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, company_slug, endpoint)
);

create index if not exists xedruo_push_subscriptions_user_company_idx
  on public.xedruo_push_subscriptions(user_id, company_slug);

alter table public.xedruo_push_subscriptions enable row level security;
revoke all on public.xedruo_push_subscriptions from public, anon, authenticated;
grant all on public.xedruo_push_subscriptions to service_role;

create or replace function private.register_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_epoch_ms bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_slug text := lower(trim(p_company_slug));
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' then
    raise exception 'Invalid company application' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.xedruo_company_app_registry
    where company_slug = v_slug and enabled = true
  ) then
    raise exception 'Company application is not registered or enabled' using errcode = '22023';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 2048 then
    raise exception 'Invalid Web Push endpoint' using errcode = '22023';
  end if;
  if p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_-]{40,256}$'
     or p_auth_secret is null or p_auth_secret !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Invalid Web Push subscription keys' using errcode = '22023';
  end if;
  if p_expiration_epoch_ms is not null and
     (p_expiration_epoch_ms < 0 or p_expiration_epoch_ms > 4102444800000) then
    raise exception 'Invalid subscription expiration' using errcode = '22023';
  end if;

  insert into public.xedruo_push_subscriptions(
    user_id, company_slug, endpoint, p256dh, auth, active, expiration_time
  )
  values (
    v_user_id, v_slug, p_endpoint, p_p256dh, p_auth_secret, true,
    case when p_expiration_epoch_ms is null then null
         else to_timestamp(p_expiration_epoch_ms / 1000.0) end
  )
  on conflict (user_id, company_slug, endpoint) do update
    set p256dh = excluded.p256dh,
        auth = excluded.auth,
        active = true,
        expiration_time = excluded.expiration_time,
        updated_at = now()
  returning id into v_id;

  if v_id is null then
    raise exception 'This push endpoint is already registered to another account or company';
  end if;
  return v_id;
end;
$$;

create or replace function private.remove_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  delete from public.xedruo_push_subscriptions
  where user_id = v_user_id
    and company_slug = lower(trim(p_company_slug))
    and endpoint = p_endpoint;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function private.register_xedruo_push_subscription(text, text, text, text, bigint) from public, anon;
grant execute on function private.register_xedruo_push_subscription(text, text, text, text, bigint) to authenticated;
revoke all on function private.remove_xedruo_push_subscription(text, text) from public, anon;
grant execute on function private.remove_xedruo_push_subscription(text, text) to authenticated;

create or replace function public.register_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_epoch_ms bigint default null
)
returns uuid
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.register_xedruo_push_subscription(
  p_company_slug, p_endpoint, p_p256dh, p_auth_secret, p_expiration_epoch_ms
); $$;

create or replace function public.remove_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text
)
returns boolean
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.remove_xedruo_push_subscription(p_company_slug, p_endpoint); $$;

revoke all on function public.register_xedruo_push_subscription(text, text, text, text, bigint) from public, anon;
grant execute on function public.register_xedruo_push_subscription(text, text, text, text, bigint) to authenticated;
revoke all on function public.remove_xedruo_push_subscription(text, text) from public, anon;
grant execute on function public.remove_xedruo_push_subscription(text, text) to authenticated;
)
);
insert into public.xedruo_country_calling_codes(country_code, calling_code) values
('AF','+93'),
('AL','+355'),
('DZ','+213'),
('AD','+376'),
('AO','+244'),
('AG','+1'),
('AR','+54'),
('AM','+374'),
('AU','+61'),
('AT','+43'),
('AZ','+994'),
('BS','+1'),
('BH','+973'),
('BD','+880'),
('BB','+1'),
('BY','+375'),
('BE','+32'),
('BZ','+501'),
('BJ','+229'),
('BT','+975'),
('BO','+591'),
('BA','+387'),
('BW','+267'),
('BR','+55'),
('BN','+673'),
('BG','+359'),
('BF','+226'),
('BI','+257'),
('CV','+238'),
('KH','+855'),
('CM','+237'),
('CA','+1'),
('CF','+236'),
('TD','+235'),
('CL','+56'),
('CN','+86'),
('CO','+57'),
('KM','+269'),
('CG','+242'),
('CD','+243'),
('CR','+506'),
('CI','+225'),
('HR','+385'),
('CU','+53'),
('CY','+357'),
('CZ','+420'),
('DK','+45'),
('DJ','+253'),
('DM','+1'),
('DO','+1'),
('EC','+593'),
('EG','+20'),
('SV','+503'),
('GQ','+240'),
('ER','+291'),
('EE','+372'),
('SZ','+268'),
('ET','+251'),
('FJ','+679'),
('FI','+358'),
('FR','+33'),
('GA','+241'),
('GM','+220'),
('GE','+995'),
('DE','+49'),
('GH','+233'),
('GR','+30'),
('GD','+1'),
('GT','+502'),
('GN','+224'),
('GW','+245'),
('GY','+592'),
('HT','+509'),
('HN','+504'),
('HU','+36'),
('IS','+354'),
('IN','+91'),
('ID','+62'),
('IR','+98'),
('IQ','+964'),
('IE','+353'),
('IL','+972'),
('IT','+39'),
('JM','+1'),
('JP','+81'),
('JO','+962'),
('KZ','+7'),
('KE','+254'),
('KI','+686'),
('KP','+850'),
('KR','+82'),
('KW','+965'),
('KG','+996'),
('LA','+856'),
('LV','+371'),
('LB','+961'),
('LS','+266'),
('LR','+231'),
('LY','+218'),
('LI','+423'),
('LT','+370'),
('LU','+352'),
('MG','+261'),
('MW','+265'),
('MY','+60'),
('MV','+960'),
('ML','+223'),
('MT','+356'),
('MH','+692'),
('MR','+222'),
('MU','+230'),
('MX','+52'),
('FM','+691'),
('MD','+373'),
('MC','+377'),
('MN','+976'),
('ME','+382'),
('MA','+212'),
('MZ','+258'),
('MM','+95'),
('NA','+264'),
('NR','+674'),
('NP','+977'),
('NL','+31'),
('NZ','+64'),
('NI','+505'),
('NE','+227'),
('NG','+234'),
('MK','+389'),
('NO','+47'),
('OM','+968'),
('PK','+92'),
('PW','+680'),
('PS','+970'),
('PA','+507'),
('PG','+675'),
('PY','+595'),
('PE','+51'),
('PH','+63'),
('PL','+48'),
('PT','+351'),
('QA','+974'),
('RO','+40'),
('RU','+7'),
('RW','+250'),
('KN','+1'),
('LC','+1'),
('VC','+1'),
('WS','+685'),
('SM','+378'),
('ST','+239'),
('SA','+966'),
('SN','+221'),
('RS','+381'),
('SC','+248'),
('SL','+232'),
('SG','+65'),
('SK','+421'),
('SI','+386'),
('SB','+677'),
('SO','+252'),
('ZA','+27'),
('SS','+211'),
('ES','+34'),
('LK','+94'),
('SD','+249'),
('SR','+597'),
('SE','+46'),
('CH','+41'),
('SY','+963'),
('TJ','+992'),
('TZ','+255'),
('TH','+66'),
('TL','+670'),
('TG','+228'),
('TO','+676'),
('TT','+1'),
('TN','+216'),
('TR','+90'),
('TM','+993'),
('TV','+688'),
('UG','+256'),
('UA','+380'),
('AE','+971'),
('GB','+44'),
('US','+1'),
('UY','+598'),
('UZ','+998'),
('VU','+678'),
('VA','+39'),
('VE','+58'),
('VN','+84'),
('YE','+967'),
('ZM','+260'),
('ZW','+263')
on conflict (country_code) do update set calling_code = excluded.calling_code;
alter table public.xedruo_country_calling_codes enable row level security;
revoke all on public.xedruo_country_calling_codes from public, anon, authenticated;

-- Phone number is collected and stored at registration, but SMS OTP is
-- intentionally deferred. A phone number is not marked verified until a
-- future OTP challenge succeeds.
create or replace function private.set_xedruo_identity_phone(
  p_country_code text,
  p_phone_e164 text
)
returns table(xedruo_id text, country_code char(2), phone_e164 text, phone_verified_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_country char(2) := upper(trim(p_country_code))::char(2);
  v_identity public.xedruo_identity%rowtype;
  v_phone text := regexp_replace(trim(p_phone_e164), '[[:space:]()-]', '', 'g');
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'Select a valid two-letter country code' using errcode = '22023';
  end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Enter a valid international phone number in E.164 format' using errcode = '22023';
  end if;

  select * into v_identity
  from public.xedruo_identity
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Create the central Xedruo identity before saving its phone number';
  end if;
  if v_identity.country_code <> v_country then
    raise exception 'The original issuing country is permanent and cannot be changed';
  end if;

  update public.xedruo_identity
  set phone_e164 = v_phone, updated_at = now()
  where user_id = v_user_id
  returning * into v_identity;

  return query select v_identity.xedruo_id, v_identity.country_code, v_identity.phone_e164, v_identity.phone_verified_at;
end;
$$;

revoke all on function private.set_xedruo_identity_phone(text, text) from public, anon;
grant execute on function private.set_xedruo_identity_phone(text, text) to authenticated;


-- PostgREST-facing RPCs are SECURITY INVOKER only. They delegate to private,
-- auth.uid()-guarded SECURITY DEFINER implementations.
create or replace function public.ensure_xedruo_identity(p_country_code text)
returns table(xedruo_id text, country_code char(2), status text, kyc_status text, created boolean)
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select * from private.ensure_xedruo_identity(p_country_code); $$;

create or replace function public.ensure_xedruo_company_profile(
  p_company_slug text,
  p_display_name text default null
)
returns public.xedruo_company_profiles
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.ensure_xedruo_company_profile(p_company_slug, p_display_name); $$;

create or replace function public.set_xedruo_identity_phone(
  p_country_code text,
  p_phone_e164 text
)
returns table(xedruo_id text, country_code char(2), phone_e164 text, phone_verified_at timestamptz)
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select * from private.set_xedruo_identity_phone(p_country_code, p_phone_e164); $$;

revoke all on function public.ensure_xedruo_identity(text) from public, anon;
grant execute on function public.ensure_xedruo_identity(text) to authenticated;
revoke all on function public.ensure_xedruo_company_profile(text, text) from public, anon;
grant execute on function public.ensure_xedruo_company_profile(text, text) to authenticated;
revoke all on function public.set_xedruo_identity_phone(text, text) from public, anon;
grant execute on function public.set_xedruo_identity_phone(text, text) to authenticated;


-- Durable notification foundation. The outbox contains identity metadata only;
-- phone numbers, OTPs, access tokens, and Google credentials are never queued.
create table if not exists public.xedruo_company_app_registry (
  company_slug text primary key check (company_slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  display_name text not null,
  app_origin text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.xedruo_company_app_registry(company_slug, display_name)
values
  ('xedruo', 'Xedruo'),
  ('xedrion-ai', 'Xedrion AI'),
  ('sportruo', 'Sportruo'),
  ('healthruo', 'Healthruo'),
  ('spacetruo', 'SpaceTruo'),
  ('hireuo', 'Hireuo'),
  ('xedruo-properties', 'Xedruo Properties'),
  ('xedruo-music', 'Xedruo Music'),
  ('pay-and-play', 'Pay & Play'),
  ('adom-global-commerce', 'Adom Global Commerce'),
  ('xedruo-global-logistics', 'Xedruo Global Logistics')
on conflict (company_slug) do update
  set display_name = excluded.display_name,
      updated_at = now();

create table if not exists public.xedruo_identity_event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('identity.created')),
  user_id uuid not null references auth.users(id) on delete restrict,
  xedruo_id text not null references public.xedruo_identity(xedruo_id) on update cascade on delete restrict,
  issuing_country char(2) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  processed_at timestamptz,
  last_error text
);

create index if not exists xedruo_identity_outbox_pending_idx
  on public.xedruo_identity_event_outbox(available_at, created_at)
  where processed_at is null;

alter table public.xedruo_company_app_registry enable row level security;
alter table public.xedruo_identity_event_outbox enable row level security;
revoke all on public.xedruo_company_app_registry from public, anon, authenticated;
revoke all on public.xedruo_identity_event_outbox from public, anon, authenticated;

create or replace function private.enqueue_xedruo_identity_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.xedruo_identity_event_outbox(
    event_type, user_id, xedruo_id, issuing_country, payload
  )
  values (
    'identity.created',
    new.user_id,
    new.xedruo_id,
    new.country_code,
    jsonb_build_object('event_version', 1)
  );
  return new;
end;
$$;

drop trigger if exists xedruo_identity_created_outbox on public.xedruo_identity;
create trigger xedruo_identity_created_outbox
after insert on public.xedruo_identity
for each row execute function private.enqueue_xedruo_identity_created();


-- Browser push subscription storage. Subscription endpoints and encryption keys
-- are private delivery credentials: clients can only register/remove their own.
create table if not exists public.xedruo_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_slug text not null default 'xedruo'
    references public.xedruo_company_app_registry(company_slug) on update cascade on delete restrict,
  endpoint text not null check (endpoint ~ '^https://'),
  p256dh text not null check (length(p256dh) between 40 and 256),
  auth text not null check (length(auth) between 16 and 128),
  user_agent text,
  active boolean not null default true,
  expiration_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, company_slug, endpoint)
);

create index if not exists xedruo_push_subscriptions_user_company_idx
  on public.xedruo_push_subscriptions(user_id, company_slug);

alter table public.xedruo_push_subscriptions enable row level security;
revoke all on public.xedruo_push_subscriptions from public, anon, authenticated;
grant all on public.xedruo_push_subscriptions to service_role;

create or replace function private.register_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_epoch_ms bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_slug text := lower(trim(p_company_slug));
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' then
    raise exception 'Invalid company application' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.xedruo_company_app_registry
    where company_slug = v_slug and enabled = true
  ) then
    raise exception 'Company application is not registered or enabled' using errcode = '22023';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 2048 then
    raise exception 'Invalid Web Push endpoint' using errcode = '22023';
  end if;
  if p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_-]{40,256}$'
     or p_auth_secret is null or p_auth_secret !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Invalid Web Push subscription keys' using errcode = '22023';
  end if;
  if p_expiration_epoch_ms is not null and
     (p_expiration_epoch_ms < 0 or p_expiration_epoch_ms > 4102444800000) then
    raise exception 'Invalid subscription expiration' using errcode = '22023';
  end if;

  insert into public.xedruo_push_subscriptions(
    user_id, company_slug, endpoint, p256dh, auth, active, expiration_time
  )
  values (
    v_user_id, v_slug, p_endpoint, p_p256dh, p_auth_secret, true,
    case when p_expiration_epoch_ms is null then null
         else to_timestamp(p_expiration_epoch_ms / 1000.0) end
  )
  on conflict (user_id, company_slug, endpoint) do update
    set p256dh = excluded.p256dh,
        auth = excluded.auth,
        active = true,
        expiration_time = excluded.expiration_time,
        updated_at = now()
  returning id into v_id;

  if v_id is null then
    raise exception 'This push endpoint is already registered to another account or company';
  end if;
  return v_id;
end;
$$;

create or replace function private.remove_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  delete from public.xedruo_push_subscriptions
  where user_id = v_user_id
    and company_slug = lower(trim(p_company_slug))
    and endpoint = p_endpoint;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function private.register_xedruo_push_subscription(text, text, text, text, bigint) from public, anon;
grant execute on function private.register_xedruo_push_subscription(text, text, text, text, bigint) to authenticated;
revoke all on function private.remove_xedruo_push_subscription(text, text) from public, anon;
grant execute on function private.remove_xedruo_push_subscription(text, text) to authenticated;

create or replace function public.register_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_epoch_ms bigint default null
)
returns uuid
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.register_xedruo_push_subscription(
  p_company_slug, p_endpoint, p_p256dh, p_auth_secret, p_expiration_epoch_ms
); $$;

create or replace function public.remove_xedruo_push_subscription(
  p_company_slug text,
  p_endpoint text
)
returns boolean
language sql
security invoker
set search_path = public, private, pg_temp
as $$ select private.remove_xedruo_push_subscription(p_company_slug, p_endpoint); $$;

revoke all on function public.register_xedruo_push_subscription(text, text, text, text, bigint) from public, anon;
grant execute on function public.register_xedruo_push_subscription(text, text, text, text, bigint) to authenticated;
revoke all on function public.remove_xedruo_push_subscription(text, text) from public, anon;
grant execute on function public.remove_xedruo_push_subscription(text, text) to authenticated;
