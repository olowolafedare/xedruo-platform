-- Xedruo unified auth: durable throttle for public login endpoints.
-- OWNER: olowolafedare/xedruo-Database (review there, then apply). Do NOT run from the platform repo.
-- Server-only: RLS enabled with NO policies, execute granted to service_role only.
-- Keys are SHA-256 hashes computed by the gateway (no raw IDs or IPs are stored).

begin;

create table if not exists public.xedruo_auth_throttle (
  id  bigint generated always as identity primary key,
  key text not null,
  at  timestamptz not null default now()
);

create index if not exists xedruo_auth_throttle_key_at on public.xedruo_auth_throttle (key, at desc);
create index if not exists xedruo_auth_throttle_at on public.xedruo_auth_throttle (at);

alter table public.xedruo_auth_throttle enable row level security;
revoke all on public.xedruo_auth_throttle from anon, authenticated;

-- true when the key already has >= p_max recorded failures inside the window.
create or replace function public.xedruo_throttle_blocked(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  delete from public.xedruo_auth_throttle
  where key = p_key and at < now() - make_interval(secs => p_window_seconds);
  select count(*) into n from public.xedruo_auth_throttle where key = p_key;
  return n >= p_max;
end
$$;

create or replace function public.xedruo_throttle_record(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.xedruo_auth_throttle (key) values (p_key);
  -- occasional global cleanup keeps the table small
  if random() < 0.01 then
    delete from public.xedruo_auth_throttle where at < now() - interval '1 day';
  end if;
end
$$;

create or replace function public.xedruo_throttle_clear(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.xedruo_auth_throttle where key = p_key;
$$;

revoke all on function public.xedruo_throttle_blocked(text, int, int) from public, anon, authenticated;
revoke all on function public.xedruo_throttle_record(text)            from public, anon, authenticated;
revoke all on function public.xedruo_throttle_clear(text)             from public, anon, authenticated;
grant execute on function public.xedruo_throttle_blocked(text, int, int) to service_role;
grant execute on function public.xedruo_throttle_record(text)            to service_role;
grant execute on function public.xedruo_throttle_clear(text)             to service_role;

commit;
