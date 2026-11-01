create table if not exists public.xedruo_country_calling_codes (
  country_code char(2) primary key,
  calling_code text not null check (calling_code like '+%')
);
insert into public.xedruo_country_calling_codes(country_code,calling_code) values
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
on conflict (country_code) do update set calling_code=excluded.calling_code;
alter table public.xedruo_country_calling_codes enable row level security;
revoke all on public.xedruo_country_calling_codes from public,anon,authenticated;

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
  select calling_code into v_calling_code
  from public.xedruo_country_calling_codes
  where country_code=v_country;
  if v_calling_code is null or left(v_phone,length(v_calling_code))<>v_calling_code then
    raise exception 'Phone calling code does not match the selected issuing country' using errcode='22023';
  end if;
  select * into v_identity
  from public.xedruo_identity
  where user_id=v_user_id
  for update;
  if not found then
    raise exception 'Create the central Xedruo identity before saving its phone number';
  end if;
  if v_identity.country_code<>v_country then
    raise exception 'The original issuing country is permanent and cannot be changed';
  end if;
  update public.xedruo_identity
  set phone_e164=v_phone,updated_at=now()
  where user_id=v_user_id
  returning * into v_identity;
  return query select v_identity.xedruo_id,v_identity.country_code,v_identity.phone_e164,v_identity.phone_verified_at;
end;
$$;
revoke all on function private.set_xedruo_identity_phone(text,text) from public,anon;
grant execute on function private.set_xedruo_identity_phone(text,text) to authenticated;
