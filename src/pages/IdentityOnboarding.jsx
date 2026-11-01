import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';
import { ensureXedruoId } from '@/lib/xedruoIdentity';
import { COUNTRIES } from '@/data/countries';

const DIAL_CODES = { AF:'+93',AL:'+355',DZ:'+213',AD:'+376',AO:'+244',AG:'+1',AR:'+54',AM:'+374',AU:'+61',AT:'+43',AZ:'+994',BS:'+1',BH:'+973',BD:'+880',BB:'+1',BY:'+375',BE:'+32',BZ:'+501',BJ:'+229',BT:'+975',BO:'+591',BA:'+387',BW:'+267',BR:'+55',BN:'+673',BG:'+359',BF:'+226',BI:'+257',CV:'+238',KH:'+855',CM:'+237',CA:'+1',CF:'+236',TD:'+235',CL:'+56',CN:'+86',CO:'+57',KM:'+269',CG:'+242',CD:'+243',CR:'+506',CI:'+225',HR:'+385',CU:'+53',CY:'+357',CZ:'+420',DK:'+45',DJ:'+253',DM:'+1',DO:'+1',EC:'+593',EG:'+20',SV:'+503',GQ:'+240',ER:'+291',EE:'+372',SZ:'+268',ET:'+251',FJ:'+679',FI:'+358',FR:'+33',GA:'+241',GM:'+220',GE:'+995',DE:'+49',GH:'+233',GR:'+30',GD:'+1',GT:'+502',GN:'+224',GW:'+245',GY:'+592',HT:'+509',HN:'+504',HU:'+36',IS:'+354',IN:'+91',ID:'+62',IR:'+98',IQ:'+964',IE:'+353',IL:'+972',IT:'+39',JM:'+1',JP:'+81',JO:'+962',KZ:'+7',KE:'+254',KI:'+686',KP:'+850',KR:'+82',KW:'+965',KG:'+996',LA:'+856',LV:'+371',LB:'+961',LS:'+266',LR:'+231',LY:'+218',LI:'+423',LT:'+370',LU:'+352',MG:'+261',MW:'+265',MY:'+60',MV:'+960',ML:'+223',MT:'+356',MH:'+692',MR:'+222',MU:'+230',MX:'+52',FM:'+691',MD:'+373',MC:'+377',MN:'+976',ME:'+382',MA:'+212',MZ:'+258',MM:'+95',NA:'+264',NR:'+674',NP:'+977',NL:'+31',NZ:'+64',NI:'+505',NE:'+227',NG:'+234',MK:'+389',NO:'+47',OM:'+968',PK:'+92',PW:'+680',PS:'+970',PA:'+507',PG:'+675',PY:'+595',PE:'+51',PH:'+63',PL:'+48',PT:'+351',QA:'+974',RO:'+40',RU:'+7',RW:'+250',KN:'+1',LC:'+1',VC:'+1',WS:'+685',SM:'+378',ST:'+239',SA:'+966',SN:'+221',RS:'+381',SC:'+248',SL:'+232',SG:'+65',SK:'+421',SI:'+386',SB:'+677',SO:'+252',ZA:'+27',SS:'+211',ES:'+34',LK:'+94',SD:'+249',SR:'+597',SE:'+46',CH:'+41',SY:'+963',TJ:'+992',TZ:'+255',TH:'+66',TL:'+670',TG:'+228',TO:'+676',TT:'+1',TN:'+216',TR:'+90',TM:'+993',TV:'+688',UG:'+256',UA:'+380',AE:'+971',GB:'+44',US:'+1',UY:'+598',UZ:'+998',VU:'+678',VA:'+39',VE:'+58',VN:'+84',YE:'+967',ZM:'+260',ZW:'+263' };
const digitsOnly = value => value.replace(/\\D/g, '');
const slugPattern = /^[a-z0-9][a-z0-9-]{1,62}$/;

export default function IdentityOnboarding() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const company = (params.get('company') || 'xedruo').toLowerCase();
  const [country,setCountry]=useState('');
  const [countrySearch,setCountrySearch]=useState('');
  const [phone,setPhone]=useState('');
  const [identity,setIdentity]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [googleConfirmed,setGoogleConfirmed]=useState(false);
  const [googleConfirming,setGoogleConfirming]=useState(false);
  const filteredCountries=useMemo(()=>{const q=countrySearch.trim().toLowerCase();return q?COUNTRIES.filter(c=>c.name.toLowerCase().includes(q)||c.code.toLowerCase()===q):COUNTRIES;},[countrySearch]);
  const selected=COUNTRIES.find(c=>c.code===country);
  const dialCode=DIAL_CODES[country]||'';

  useEffect(()=>{(async()=>{try{
    if(!user?.id) throw new Error('Your sign-in session is not ready. Please sign in again.');
    const {data:{user:authUser},error:authError}=await supabase.auth.getUser();
    if(authError) throw authError;
    const hasGoogleIdentity=(authUser?.identities||[]).some(item=>item.provider==='google');
    setGoogleConfirmed(hasGoogleIdentity);
    const {data}=await supabase.from('xedruo_identity').select('xedruo_id,country_code,phone_e164').eq('user_id',user.id).maybeSingle();
    if(data){setCountry(data.country_code);setPhone(data.phone_e164||'');if(data.phone_e164)setIdentity(data);}
  }catch(e){setError(e.message||'Could not load identity registration.');}finally{setLoading(false);}})();},[user?.id]);

  useEffect(()=>{if(!dialCode)return;setPhone(current=>{const digits=digitsOnly(current);return dialCode+(digits.startsWith(digitsOnly(dialCode))?digits.slice(digitsOnly(dialCode).length):digits.replace(/^0/,''));});},[country]);

  const confirmGoogle=async()=>{
    setError('');setGoogleConfirming(true);
    try{
      const {data,error:linkError}=await supabase.auth.linkIdentity({provider:'google',options:{redirectTo:window.location.href}});
      if(linkError)throw linkError;
      if(data?.url)window.location.assign(data.url);
      else throw new Error('Google confirmation could not be started. Please try again.');
    }catch(e){setError(e.message||'Google confirmation failed.');setGoogleConfirming(false);}
  };

  const register=async()=>{
    setError('');
    if(!country||!selected)return setError('Select your issuing country.');
    if(!dialCode)return setError('This country calling code is not configured yet.');
    const digits=digitsOnly(phone);
    const local=digits.startsWith(digitsOnly(dialCode))?digits.slice(digitsOnly(dialCode).length):digits.replace(/^0/,'');
    const fullPhone=dialCode+local;
    if(local.length<6||local.length>12)return setError('Enter a valid phone number for the selected country.');
    if(!user?.id)return setError('Your sign-in session is not ready. Please sign in again.');
    setSaving(true);
    try{
      const {data:{user:authUser},error:authError}=await supabase.auth.getUser();
      if(authError)throw authError;
      const hasGoogleIdentity=(authUser?.identities||[]).some(item=>item.provider==='google');
      setGoogleConfirmed(hasGoogleIdentity);
      if(!hasGoogleIdentity)throw new Error('Confirm your Google account before creating your permanent Xedruo ID.');
      const created=await ensureXedruoId({countryCode:country});
      const {data:phoneData,error:phoneError}=await supabase.rpc('set_xedruo_identity_phone',{p_country_code:country,p_phone_e164:fullPhone});
      if(phoneError)throw phoneError;
      if(slugPattern.test(company)){
        const {error:profileError}=await supabase.rpc('ensure_xedruo_company_profile',{p_company_slug:company,p_display_name:authUser.user_metadata?.full_name||authUser.email||null});
        if(profileError)throw profileError;
      }
      setIdentity({...created,phone_e164:phoneData?.[0]?.phone_e164||fullPhone,country_code:country});
    }catch(e){setError(e.message||'Could not complete registration.');}finally{setSaving(false);}
  };

  const continueNext=()=>{localStorage.removeItem('xedruo_oauth_return_to');navigate('/dashboard',{replace:true});};
  if(loading)return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if(identity)return <AuthLayout icon={ShieldCheck} title="Your Xedruo identity is ready" subtitle="Your registration is complete. Phone SMS verification will be added in a later release."><div className="rounded-2xl border bg-muted/30 p-5 space-y-3"><div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-primary"/><div><p className="font-semibold">Permanent Xedruo ID</p><p className="text-2xl font-bold tracking-widest">{identity.xedruo_id}</p></div></div><p className="text-sm text-muted-foreground">Phone: {identity.phone_e164||phone}</p><p className="text-sm text-muted-foreground">Issuing country: {identity.country_code}</p><p className="text-xs text-muted-foreground">Your phone number is saved but is not yet marked as verified. SMS OTP will be enabled later. KYC remains separate.</p></div><Button className="w-full h-12 mt-5" onClick={continueNext}>Continue</Button></AuthLayout>;
  return <AuthLayout icon={Phone} title="Complete your registration" subtitle="Confirm your Google account, select your original issuing country, and provide a phone number. SMS verification is temporarily deferred.">{error&&<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}<div className="space-y-4">{!googleConfirmed&&<div className="rounded-lg border p-3 space-y-2"><p className="text-sm font-medium">Google account confirmation required</p><p className="text-xs text-muted-foreground">Confirm Google in this app. Your existing Xedruo sign-in session will be linked rather than creating a second account.</p><Button type="button" variant="outline" className="w-full" onClick={confirmGoogle} disabled={googleConfirming}>{googleConfirming?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Connecting Google...</>:'Continue with Google'}</Button></div>}<div className="space-y-2"><Label>Issuing country</Label><Input placeholder="Search country..." value={countrySearch} onChange={e=>setCountrySearch(e.target.value)}/><select aria-label="Select issuing country" className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm" value={country} onChange={e=>setCountry(e.target.value)}><option value="">Select country</option>{filteredCountries.map(c=><option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}</select></div><div className="space-y-2"><Label htmlFor="identity-phone">Phone number</Label><div className="flex gap-2"><div className="w-24 shrink-0 flex items-center justify-center rounded-md border bg-muted/40 font-semibold text-sm">{dialCode||'+'}</div><Input id="identity-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={dialCode+' 8012345678'} value={digitsOnly(phone).replace(digitsOnly(dialCode),'').replace(/^0/,'')} onChange={e=>setPhone(dialCode+digitsOnly(e.target.value).replace(/^0/,''))}/></div><p className="text-xs text-muted-foreground">The selected country, phone calling code, and permanent Xedruo ID prefix must match. Your original issuing country cannot later be changed.</p></div><div className="rounded-lg border p-3 text-sm text-muted-foreground">Google account confirmation is required. SMS OTP is intentionally skipped for now; the phone number is still required and saved.</div><Button className="w-full h-12" onClick={register} disabled={saving||!googleConfirmed||!country||!dialCode||!phone}>{saving?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating identity...</>:'Confirm Google & create Xedruo ID'}</Button></div></AuthLayout>;
}
