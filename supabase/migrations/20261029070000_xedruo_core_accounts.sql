begin;

create table if not exists public.xedruo_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.xedruo_accounts enable row level security;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

create table if not exists public.xedruo_user_roles (
  user_id uuid not null references public.xedruo_accounts (id) on delete cascade,
  role text not null check (
    role in (
      'admin',
      'governor',
      'ceo',
      'cfo',
      'developer',
      'customer_service',
      'operations'
    )
  ),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create unique index if not exists xedruo_user_roles_one_staff_role
  on public.xedruo_user_roles (user_id)
  where role in ('governor', 'ceo', 'cfo', 'developer', 'customer_service', 'operations');

alter table public.xedruo_user_roles enable row level security;

create or replace function public.xedruo_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.xedruo_set_updated_at() from public, anon, authenticated;

drop trigger if exists xedruo_accounts_set_updated_at on public.xedruo_accounts;
create trigger xedruo_accounts_set_updated_at
  before update on public.xedruo_accounts
  for each row execute function public.xedruo_set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.xedruo_set_updated_at();

create or replace function public.xedruo_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.xedruo_accounts (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.xedruo_handle_new_auth_user() from public, anon, authenticated;

insert into public.xedruo_accounts (id)
select id
from auth.users
on conflict (id) do nothing;

insert into public.profiles (id, full_name, avatar_url)
select
  id,
  nullif(raw_user_meta_data ->> 'full_name', ''),
  nullif(raw_user_meta_data ->> 'avatar_url', '')
from auth.users
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.xedruo_handle_new_auth_user();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    execute $migration$
      insert into public.xedruo_user_roles (user_id, role)
      select id, role
      from public.profiles
      where role in (
        'admin',
        'governor',
        'ceo',
        'cfo',
        'developer',
        'customer_service',
        'operations'
      )
      on conflict (user_id, role) do nothing
    $migration$;
  end if;
end;
$$;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', existing_policy.policyname);
  end loop;
end;
$$;

create policy xedruo_profiles_read_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy xedruo_profiles_update_own_active
  on public.profiles
  for update
  to authenticated
  using (
    id = (select auth.uid())
    and exists (
      select 1
      from public.xedruo_accounts as account
      where account.id = (select auth.uid())
        and account.status = 'active'
    )
  )
  with check (
    id = (select auth.uid())
    and exists (
      select 1
      from public.xedruo_accounts as account
      where account.id = (select auth.uid())
        and account.status = 'active'
    )
  );

create policy xedruo_accounts_read_own
  on public.xedruo_accounts
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy xedruo_user_roles_read_own
  on public.xedruo_user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.xedruo_accounts from public, anon, authenticated;
grant select on table public.xedruo_accounts to authenticated;

revoke all on table public.profiles from public, anon, authenticated;
grant select (id, full_name, avatar_url, bio, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (full_name, avatar_url, bio)
  on table public.profiles to authenticated;

revoke all on table public.xedruo_user_roles from public, anon, authenticated;
grant select on table public.xedruo_user_roles to authenticated;

grant all on table public.xedruo_accounts to service_role;
grant all on table public.profiles to service_role;
grant all on table public.xedruo_user_roles to service_role;

create or replace function public.xedruo_set_user_role(
  p_user_id uuid,
  p_role text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_role is null or p_role not in (
    'admin',
    'governor',
    'ceo',
    'cfo',
    'developer',
    'customer_service',
    'operations'
  ) then
    raise exception 'Unsupported Xedruo role: %', p_role
      using errcode = '22023';
  end if;

  if p_enabled is null then
    raise exception 'Role assignment state is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.xedruo_accounts
    where id = p_user_id
  ) then
    raise exception 'Xedruo account does not exist: %', p_user_id
      using errcode = '22023';
  end if;

  if p_enabled then
    insert into public.xedruo_user_roles (user_id, role)
    values (p_user_id, p_role)
    on conflict (user_id, role) do nothing;
  else
    delete from public.xedruo_user_roles
    where user_id = p_user_id
      and role = p_role;
  end if;
end;
$$;

revoke all on function public.xedruo_set_user_role(uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.xedruo_set_user_role(uuid, text, boolean)
  to service_role;

create or replace function public.xedruo_set_account_status(
  p_user_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status is null or p_status not in ('active', 'suspended') then
    raise exception 'Unsupported Xedruo account status: %', p_status
      using errcode = '22023';
  end if;

  update public.xedruo_accounts
  set status = p_status
  where id = p_user_id;

  if not found then
    raise exception 'Xedruo account does not exist: %', p_user_id
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.xedruo_set_account_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.xedruo_set_account_status(uuid, text)
  to service_role;

commit;
