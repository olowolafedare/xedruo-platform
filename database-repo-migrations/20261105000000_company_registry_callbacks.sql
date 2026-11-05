-- Xedruo unified auth: per-company callback allowlists on the company registry.
-- OWNER: olowolafedare/xedruo-Database (review there, then apply). Do NOT run from the platform repo.
-- ASSUMPTION: registry columns are company_slug, display_name, enabled, app_origin.
-- If your column names differ, adjust this file and the REG constant in gateway/index.ts.

begin;

alter table public.xedruo_company_app_registry
  add column if not exists allowed_callbacks   text[] not null default '{}',
  add column if not exists allowed_logout_urls text[] not null default '{}';

-- Every callback/logout URL must live on the company's own registered origin.
-- A company with no origin (the platform/admin row) may not have any.
create or replace function public.xedruo_urls_on_origin(p_origin text, p_urls text[])
returns boolean
language sql

immutable
as $$
  select case
    when coalesce(cardinality(p_urls), 0) = 0 then true
    when p_origin is null then false
    else not exists (
      select 1 from unnest(p_urls) as u
      where u is null
         or (u <> p_origin and left(u, length(p_origin) + 1) <> p_origin || '/')
    )
  end
$$;

alter table public.xedruo_company_app_registry
  drop constraint if exists xedruo_registry_callbacks_on_origin;
alter table public.xedruo_company_app_registry
  add constraint xedruo_registry_callbacks_on_origin check (
    public.xedruo_urls_on_origin(app_origin, allowed_callbacks)
    and public.xedruo_urls_on_origin(app_origin, allowed_logout_urls)
  );

-- Seed the default callback path the shared auth client uses (/auth/callback).
-- Verify each product actually serves this path before enabling sign-in there.
update public.xedruo_company_app_registry
set allowed_callbacks   = array[app_origin || '/auth/callback'],
    allowed_logout_urls = array[app_origin || '/']
where app_origin is not null
  and cardinality(allowed_callbacks) = 0;

commit;

-- AFTER applying: mirror these URLs in Supabase Dashboard > Authentication > URL Configuration
-- (Redirect URLs). Supabase enforces that list at OAuth time; this table is the source of truth.
