create or replace function private.set_xedruo_identity_phone(
  p_country_code text,
  p_phone_e164 text
)
returns table(xedruo_id text,country_code char(2),phone_e164 text,phone_verified_at timestamptz)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_country char(2) := upper(trim(p_country_code))::char(2);
  v_identity public.xedruo_identity%rowtype;
  v_phone text := trim(p_phone_e164);
  v_calling_code text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'Select a valid two-letter country code' using errcode='22023';
  end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Enter a valid international phone number in E.164 format' using errcode='22023';
  end if;
  select cc.calling_code into v_calling_code
  from public.xedruo_country_calling_codes as cc
  where cc.country_code=v_country;
  if v_calling_code is null or left(v_phone,length(v_calling_code))<>v_calling_code then
    raise exception 'Phone calling code does not match the selected issuing country' using errcode='22023';
  end if;
  select * into v_identity
  from public.xedruo_identity as identity_row
  where identity_row.user_id=v_user_id
  for update;
  if not found then
    raise exception 'Create the central Xedruo identity before saving its phone number';
  end if;
  if v_identity.country_code<>v_country then
    raise exception 'The original issuing country is permanent and cannot be changed';
  end if;
  update public.xedruo_identity as identity_row
  set phone_e164=v_phone,updated_at=now()
  where identity_row.user_id=v_user_id
  returning identity_row.* into v_identity;
  return query select v_identity.xedruo_id,v_identity.country_code,v_identity.phone_e164,v_identity.phone_verified_at;
end;
$$;
revoke all on function private.set_xedruo_identity_phone(text,text) from public,anon;
grant execute on function private.set_xedruo_identity_phone(text,text) to authenticated;