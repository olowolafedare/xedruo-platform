import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';
import { ensureXedruoId, getIdentity, saveCustomerContact } from '@/lib/xedruoIdentity';
import { handoffToCompany } from '@/lib/companyHandoff';
import { COUNTRIES } from '@/data/countries';

const DIAL_CODES = { AF:'+93',AL:'+355',DZ:'+213',AD:'+376',AO:'+244',AG:'+1',AR:'+54',AM:'+374',AU:'+61',AT:'+43',AZ:'+994',BS:'+1',BH:'+973',BD:'+880',BB:'+1',BY:'+375',BE:'+32',BZ:'+501',BJ:'+229',BT:'+975',BO:'+591',BA:'+387',BW:'+267',BR:'+55',BN:'+673',BG:'+359',BF:'+226',BI:'+257',CV:'+238',KH:'+855',CM:'+237',CA:'+1',CF:'+236',TD:'+235',CL:'+56',CN:'+86',CO:'+57',KM:'+269',CG:'+242',CD:'+243',CR:'+506',CI:'+225',HR:'+385',CU:'+53',CY:'+357',CZ:'+420',DK:'+45',DJ:'+253',DM:'+1',DO:'+1',EC:'+593',EG:'+20',SV:'+503',GQ:'+240',ER:'+291',EE:'+372',SZ:'+268',ET:'+251',FJ:'+679',FI:'+358',FR:'+33',GA:'+241',GM:'+220',GE:'+995',DE:'+49',GH:'+233',GR:'+30',GD:'+1',GT:'+502',GN:'+224',GW:'+245',GY:'+592',HT:'+509',HN:'+504',HU:'+36',IS:'+354',IN:'+91',ID:'+62',IR:'+98',IQ:'+964',IE:'+353',IL:'+972',IT:'+39',JM:'+1',JP:'+81',JO:'+962',KZ:'+7',KE:'+254',KI:'+686',KP:'+850',KR:'+82',KW:'+965',KG:'+996',LA:'+856',LV:'+371',LB:'+961',LS:'+266',LR:'+231',LY:'+218',LI:'+423',LT:'+370',LU:'+352',MG:'+261',MW:'+265',MY:'+60',MV:'+960',ML:'+223',MT:'+356',MH:'+692',MR:'+222',MU:'+230',MX:'+52',FM:'+691',MD:'+373',MC:'+377',MN:'+976',ME:'+382',MA:'+212',MZ:'+258',MM:'+95',NA:'+264',NR:'+674',NP:'+977',NL:'+31',NZ:'+64',NI:'+505',NE:'+227',NG:'+234',MK:'+389',NO:'+47',OM:'+968',PK:'+92',PW:'+680',PS:'+970',PA:'+507',PG:'+675',PY:'+595',PE:'+51',PH:'+63',PL:'+48',PT:'+351',QA:'+974',RO:'+40',RU:'+7',RW:'+250',KN:'+1',LC:'+1',VC:'+1',WS:'+685',SM:'+378',ST:'+239',SA:'+966',SN:'+221',RS:'+381',SC:'+248',SL:'+232',SG:'+65',SK:'+421',SI:'+386',SB:'+677',SO:'+252',ZA:'+27',SS:'+211',ES:'+34',LK:'+94',SD:'+249',SR:'+597',SE:'+46',CH:'+41',SY:'+963',TJ:'+992',TZ:'+255',TH:'+66',TL:'+670',TG:'+228',TO:'+676',TT:'+1',TN:'+216',TR:'+90',TM:'+993',TV:'+688',UG:'+256',UA:'+380',AE:'+971',GB:'+44',US:'+1',UY:'+598',UZ:'+998',VU:'+678',VA:'+39',VE:'+58',VN:'+84',YE:'+967',ZM:'+260',ZW:'+263' };
const countryFlag = (code) => [...String(code || '').trim().toUpperCase()].map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join('');
const normalizePhone = (value) => value.trim().replace(/[^0-9+]/g, '');
const digitsOnly = (value) => value.replace(/\D/g, '');
const readableError = (err, fallback = 'Something went wrong. Please try again.') => {
  const message = typeof err?.message === 'string' ? err.message.trim() : '';
  if (message && message !== '{}' && message !== '[object Object]') return message;
  return fallback;
};

export default function IdentityOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [step, setStep] = useState('contact');
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user?.id) throw new Error('Your login session is not ready. Please sign in again.');
        const current = await getIdentity();
        if (!alive) return;
        if (current?.country_code) setCountry(current.country_code.trim());
        if (current?.phone_e164) setPhone(current.phone_e164);
        if (current?.phone_e164 && current?.xedruo_id && /^[A-Z]{2}-[0-9]{10}$/.test(current.xedruo_id)) {
          setIdentity(current);
          setStep('complete');
        } else {
          setStep('contact');
        }
      } catch (err) {
        if (alive) setError(readableError(err, 'Could not load onboarding.'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : COUNTRIES;
  }, [countrySearch]);
  const selected = COUNTRIES.find((c) => c.code === country);
  const dialCode = DIAL_CODES[country] || '';

  useEffect(() => {
    if (!dialCode) return;
    const current = normalizePhone(phone);
    if (!current || current === '+') {
      setPhone(dialCode);
      return;
    }
    if (current.startsWith('+') && !current.startsWith(dialCode)) {
      const matched = Object.values(DIAL_CODES).find((code) => current.startsWith(code));
      setPhone(dialCode + (matched ? digitsOnly(current.slice(matched.length)) : digitsOnly(current)));
    } else if (!current.startsWith('+')) {
      setPhone(dialCode + digitsOnly(current).replace(/^0/, ''));
    }
  }, [country]);

  const saveIdentity = async () => {
    if (!country) throw new Error('Select your country.');
    const value = normalizePhone(phone);
    const local = value.startsWith(dialCode) ? digitsOnly(value.slice(dialCode.length)) : digitsOnly(value).replace(/^0/, '');
    const fullPhone = dialCode + local;
    if (!dialCode || local.length < 6 || local.length > 13) {
      throw new Error(`Enter a valid phone number for ${selected?.name || 'your country'}.`);
    }
    if (!user?.id) throw new Error('Your login session is not ready. Please sign in again.');
    // Issue the central identity first. The phone RPC intentionally only
    // updates an identity row and cannot create one for a first-time user.
    await ensureXedruoId({ countryCode: country });
    await saveCustomerContact({ countryCode: country, phoneE164: fullPhone });
    const current = await getIdentity();
    if (!current?.xedruo_id) throw new Error('Your Xedruo ID could not be loaded. Please try again.');
    setPhone(fullPhone);
    setIdentity(current);
    return { current, fullPhone };
  };



  const saveAndContinue = async () => {
    setError('');
    setSending(true);
    try {
      const { current } = await saveIdentity();
      setIdentity(current);
      setStep('complete');
    } catch (err) {
      setError(readableError(err, 'Could not save your phone number and complete your Xedruo identity.'));
    } finally {
      setSending(false);
    }
  };

  const continueAfterOnboarding = async () => {
    const saved = localStorage.getItem('xedruo_oauth_return_to');
    const from = location.state?.from;
    const safe = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
    // Never fall back to /management: that is the staff area, not a customer destination.
    const destination = safe(saved) || safe(from) || '/';
    const company = String(localStorage.getItem('xedruo_oauth_company') || '').trim().toLowerCase();
    const { data: { session } } = await supabase.auth.getSession();
    localStorage.removeItem('xedruo_oauth_return_to');
    localStorage.removeItem('xedruo_oauth_company');
    if (handoffToCompany(session, company, destination)) return;
    navigate(destination, { replace: true });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (step === 'complete' && identity) {
    return (
      <AuthLayout icon={ShieldCheck} title="Your Xedruo account is ready" subtitle="Your central Xedruo identity can be used across the connected company applications.">
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold">Your Xedruo ID</p>
              <p className="text-2xl font-bold tracking-widest">{identity.xedruo_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4" /> {identity.phone_e164}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {identity.phone_verified_at ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Clock3 className="w-4 h-4" />}
            {identity.phone_verified_at ? 'Phone number verified' : 'Phone number saved; verification can be completed later'}
          </div>
          <p className="text-sm text-muted-foreground">Your Google sign-in remains your account authentication. Your phone number is attached to your Xedruo identity, and regional KYC can be completed when required.</p>
        </div>
        <Button className="w-full h-12 mt-4" onClick={continueAfterOnboarding}>Continue to Xedruo</Button>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout icon={Phone} title="Verify your phone number" subtitle={`We sent a 6-digit SMS verification code to ${phone}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="rounded-xl border bg-muted/30 p-4 mb-6 text-sm">
          <p className="font-semibold">Check your SMS messages</p>
          <p className="text-muted-foreground mt-1">Enter the 6-digit code sent to your phone number. It expires according to your authentication provider's OTP policy.</p>
        </div>
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12" onClick={verifyPhone} disabled={sending || otp.length !== 6}>
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify phone number'}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={ShieldCheck} title="Complete your Xedruo account" subtitle="Choose your issuing country and add your phone number. Your Xedruo ID is generated centrally and works across company apps.">
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input placeholder="Search country..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
          <select aria-label="Select country" className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select country</option>
            {filteredCountries.map((c) => <option key={c.code} value={c.code}>{countryFlag(c.code)} {c.name}</option>)}
          </select>
        </div>
        {dialCode && <div className="space-y-2"><Label htmlFor="onboarding-calling-code">Country calling code</Label><Input id="onboarding-calling-code" readOnly value={dialCode} /></div>}
        <div className="space-y-2">
          <Label htmlFor="onboarding-phone">Phone number</Label>
          <div className="flex gap-2">
            <div className="w-24 shrink-0 flex items-center justify-center rounded-md border bg-muted/40 font-semibold text-sm">{dialCode || '+'}</div>
            <Input id="onboarding-phone" type="tel" autoComplete="tel" placeholder={dialCode ? `${dialCode} 8012345678` : '+2348012345678'} value={phone.startsWith(dialCode) ? phone.slice(dialCode.length) : phone} onChange={(e) => setPhone(`${dialCode}${digitsOnly(e.target.value).replace(/^0/, '')}`)} />
          </div>
        </div>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">Your country determines your Xedruo ID prefix. Save your phone number to complete your shared Xedruo identity. SMS verification is not required.</div>
        <Button className="w-full h-12" onClick={saveAndContinue} disabled={sending || !country || !dialCode || !phone.trim()}>
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving your account...</> : 'Save phone & continue'}
        </Button>
      </div>
    </AuthLayout>
  );
}
