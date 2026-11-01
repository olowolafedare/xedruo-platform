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
set search_path=public,pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_slug text := lower(trim(p_company_slug));
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' then
    raise exception 'Invalid company application' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.xedruo_company_app_registry
    where company_slug=v_slug and enabled=true
  ) then
    raise exception 'Company application is not registered or enabled' using errcode='22023';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint)>2048 then
    raise exception 'Invalid Web Push endpoint' using errcode='22023';
  end if;
  if p_p256dh is null or length(p_p256dh)<40 or length(p_p256dh)>256
     or p_p256dh !~ '^[A-Za-z0-9_-]+$'
     or p_auth_secret is null or length(p_auth_secret)<16 or length(p_auth_secret)>128
     or p_auth_secret !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Invalid Web Push subscription keys' using errcode='22023';
  end if;
  if p_expiration_epoch_ms is not null and
     (p_expiration_epoch_ms<0 or p_expiration_epoch_ms>4102444800000) then
    raise exception 'Invalid subscription expiration' using errcode='22023';
  end if;
  insert into public.xedruo_push_subscriptions(
    user_id,company_slug,endpoint,p256dh,auth,active,expiration_time
  )
  values (
    v_user_id,v_slug,p_endpoint,p_p256dh,p_auth_secret,true,
    case when p_expiration_epoch_ms is null then null
         else to_timestamp(p_expiration_epoch_ms/1000.0) end
  )
  on conflict (user_id,company_slug,endpoint) do update
    set p256dh=excluded.p256dh,
        auth=excluded.auth,
        active=true,
        expiration_time=excluded.expiration_time,
        updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function private.register_xedruo_push_subscription(text,text,text,text,bigint) from public,anon;
grant execute on function private.register_xedruo_push_subscription(text,text,text,text,bigint) to authenticated;