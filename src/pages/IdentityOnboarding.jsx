import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  Phone,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';
import { getIdentity, saveCustomerContact } from '@/lib/xedruoIdentity';
import { handoffToCompany } from '@/lib/companyHandoff';
import { COUNTRIES } from '@/data/countries';

const DIAL_CODES = {
  AF:'+93',AL:'+355',DZ:'+213',AD:'+376',AO:'+244',AG:'+1',
  AR:'+54',AM:'+374',AU:'+61',AT:'+43',AZ:'+994',BS:'+1',
  BH:'+973',BD:'+880',BB:'+1',BY:'+375',BE:'+32',BZ:'+501',
  BJ:'+229',BT:'+975',BO:'+591',BA:'+387',BW:'+267',BR:'+55',
  BN:'+673',BG:'+359',BF:'+226',BI:'+257',CV:'+238',KH:'+855',
  CM:'+237',CA:'+1',CF:'+236',TD:'+235',CL:'+56',CN:'+86',
  CO:'+57',KM:'+269',CG:'+242',CD:'+243',CR:'+506',CI:'+225',
  HR:'+385',CU:'+53',CY:'+357',CZ:'+420',DK:'+45',DJ:'+253',
  DM:'+1',DO:'+1',EC:'+593',EG:'+20',SV:'+503',GQ:'+240',
  ER:'+291',EE:'+372',SZ:'+268',ET:'+251',FJ:'+679',FI:'+358',
  FR:'+33',GA:'+241',GM:'+220',GE:'+995',DE:'+49',GH:'+233',
  GR:'+30',GD:'+1',GT:'+502',GN:'+224',GW:'+245',GY:'+592',
  HT:'+509',HN:'+504',HU:'+36',IS:'+354',IN:'+91',ID:'+62',
  IR:'+98',IQ:'+964',IE:'+353',IL:'+972',IT:'+39',JM:'+1',
  JP:'+81',JO:'+962',KZ:'+7',KE:'+254',KI:'+686',KP:'+850',
  KR:'+82',KW:'+965',KG:'+996',LA:'+856',LV:'+371',LB:'+961',
  LS:'+266',LR:'+231',LY:'+218',LI:'+423',LT:'+370',LU:'+352',
  MG:'+261',MW:'+265',MY:'+60',MV:'+960',ML:'+223',MT:'+356',
  MH:'+692',MR:'+222',MU:'+230',MX:'+52',FM:'+691',MD:'+373',
  MC:'+377',MN:'+976',ME:'+382',MA:'+212',MZ:'+258',MM:'+95',
  NA:'+264',NR:'+674',NP:'+977',NL:'+31',NZ:'+64',NI:'+505',
  NE:'+227',NG:'+234',MK:'+389',NO:'+47',OM:'+968',PK:'+92',
  PW:'+680',PS:'+970',PA:'+507',PG:'+675',PY:'+595',PE:'+51',
  PH:'+63',PL:'+48',PT:'+351',QA:'+974',RO:'+40',RU:'+7',
  RW:'+250',KN:'+1',LC:'+1',VC:'+1',WS:'+685',SM:'+378',
  ST:'+239',SA:'+966',SN:'+221',RS:'+381',SC:'+248',SL:'+232',
  SG:'+65',SK:'+421',SI:'+386',SB:'+677',SO:'+252',ZA:'+27',
  SS:'+211',ES:'+34',LK:'+94',SD:'+249',SR:'+597',SE:'+46',
  CH:'+41',SY:'+963',TJ:'+992',TZ:'+255',TH:'+66',TL:'+670',
  TG:'+228',TO:'+676',TT:'+1',TN:'+216',TR:'+90',TM:'+993',
  TV:'+688',UG:'+256',UA:'+380',AE:'+971',GB:'+44',US:'+1',
  UY:'+598',UZ:'+998',VU:'+678',VA:'+39',VE:'+58',VN:'+84',
  YE:'+967',ZM:'+260',ZW:'+263',
};

const countryFlag = (code) =>
  [...String(code || '').trim().toUpperCase()]
    .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    .join('');

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const normalizePhone = (value) =>
  String(value || '').trim().replace(/[^0-9+]/g, '');

const readableError = (
  err,
  fallback = 'Something went wrong. Please try again.'
) => {
  const message =
    typeof err?.message === 'string' ? err.message.trim() : '';

  if (message && message !== '{}' && message !== '[object Object]') {
    return message;
  }

  return fallback;
};

export default function IdentityOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [phone, setPhone] = useState('');
  const [legalName, setLegalName] = useState('');

  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('contact');

  const [identity, setIdentity] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [countryLocked, setCountryLocked] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const selected = useMemo(
    () => COUNTRIES.find((item) => item.code === country),
    [country]
  );

  const dialCode = DIAL_CODES[country] || '';

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();

    if (!query) return COUNTRIES;

    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase() === query
    );
  }, [countrySearch]);

  const getFullPhone = () => {
    const normalized = normalizePhone(phone);

    if (!dialCode) return normalized;

    if (normalized.startsWith(dialCode)) {
      return normalized;
    }

    return dialCode + digitsOnly(normalized).replace(/^0/, '');
  };

  const loadAuthUser = async () => {
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!data?.user) {
      throw new Error('Your login session has expired. Please sign in again.');
    }

    setAuthUser(data.user);

    return data.user;
  };

  useEffect(() => {
    let alive = true;

    const initialize = async () => {
      try {
        if (!user?.id) {
          throw new Error(
            'Your login session is not ready. Please sign in again.'
          );
        }

        const [current, currentAuthUser] = await Promise.all([
          getIdentity(),
          loadAuthUser(),
        ]);

        if (!alive) return;

        setIdentity(current);

        const existingCountry = current?.country_code
          ? current.country_code.trim().toUpperCase()
          : '';

        const metadataCountry = String(
          currentAuthUser.user_metadata?.country_code || ''
        ).toUpperCase();

        const initialCountry = existingCountry || metadataCountry;

        if (initialCountry) {
          setCountry(initialCountry);
        }

        if (existingCountry) {
          setCountryLocked(true);
        }

        if (current?.legal_name) {
          setLegalName(current.legal_name);
        }

        const authPhone = currentAuthUser.phone || '';
        const identityPhone = current?.phone_e164 || '';

        const initialPhone = authPhone || identityPhone;

        if (initialPhone) {
          setPhone(initialPhone);
        }

        const verified =
          Boolean(currentAuthUser.phone_confirmed_at) &&
          Boolean(authPhone) &&
          authPhone === initialPhone;

        setPhoneVerified(verified);

        const complete =
          Boolean(current?.xedruo_id) &&
          Boolean(current?.legal_name) &&
          Boolean(current?.phone_e164) &&
          Boolean(current?.phone_verified_at) &&
          verified;

        if (complete) {
          setStep('complete');
        } else {
          setStep('contact');
        }

        const pending = localStorage.getItem('xedruo_pending_contact');

        if (pending) {
          try {
            const contact = JSON.parse(pending);

            if (!existingCountry && contact?.countryCode) {
              setCountry(String(contact.countryCode).toUpperCase());
            }

            if (!authPhone && !identityPhone && contact?.phoneE164) {
              setPhone(String(contact.phoneE164));
            }

            if (!current?.legal_name && contact?.legalName) {
              setLegalName(String(contact.legalName));
            }
          } catch {
            localStorage.removeItem('xedruo_pending_contact');
          }
        }
      } catch (err) {
        if (alive) {
          setError(readableError(err, 'Could not load onboarding.'));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    initialize();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!dialCode) return;

    const normalized = normalizePhone(phone);

    if (!normalized || normalized === '+') {
      setPhone(dialCode);
      return;
    }

    if (normalized.startsWith('+') && !normalized.startsWith(dialCode)) {
      const matched = Object.values(DIAL_CODES).find((code) =>
        normalized.startsWith(code)
      );

      const localDigits = matched
        ? digitsOnly(normalized.slice(matched.length))
        : digitsOnly(normalized);

      setPhone(dialCode + localDigits);
    } else if (!normalized.startsWith('+')) {
      setPhone(dialCode + digitsOnly(normalized).replace(/^0/, ''));
    }
  }, [country]);

  const validateContact = () => {
    if (!country) {
      throw new Error('Select your issuing country.');
    }

    if (!dialCode) {
      throw new Error('The selected country calling code is unavailable.');
    }

    const normalizedLegalName = legalName.trim().replace(/\s+/g, ' ');

    if (
      normalizedLegalName.length < 3 ||
      normalizedLegalName.length > 160
    ) {
      throw new Error('Enter your full legal name (3–160 characters).');
    }

    const fullPhone = getFullPhone();

    if (!/^\+[1-9][0-9]{7,14}$/.test(fullPhone)) {
      throw new Error(
        `Enter a valid phone number for ${selected?.name || 'your country'}.`
      );
    }

    return {
      fullPhone,
      normalizedLegalName,
    };
  };

  const sendPhoneVerification = async () => {
    setError('');
    setSending(true);

    try {
      const { fullPhone } = validateContact();

      const currentAuthUser = await loadAuthUser();

      if (!currentAuthUser?.id) {
        throw new Error('Authentication required.');
      }

      // If this exact phone is already confirmed, no new OTP is needed.
      if (
        currentAuthUser.phone === fullPhone &&
        currentAuthUser.phone_confirmed_at
      ) {
        setPhoneVerified(true);
        await completeIdentity(fullPhone);
        return;
      }

      // Attach or change the Auth phone number.
      // Supabase sends a phone-change OTP to the submitted number.
      const { error: updateError } = await supabase.auth.updateUser({
        phone: fullPhone,
      });

      if (updateError) throw updateError;

      setPhone(fullPhone);
      setOtp('');
      setStep('otp');
    } catch (err) {
      setError(
        readableError(err, 'Could not send the phone verification code.')
      );
    } finally {
      setSending(false);
    }
  };

  const verifyPhone = async () => {
    setError('');
    setSending(true);

    try {
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Enter the complete 6-digit verification code.');
      }

      const fullPhone = getFullPhone();

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'phone_change',
      });

      if (verifyError) throw verifyError;

      const verifiedUser = await loadAuthUser();

      if (
        verifiedUser.phone !== fullPhone ||
        !verifiedUser.phone_confirmed_at
      ) {
        throw new Error(
          'Phone verification could not be confirmed. Please try again.'
        );
      }

      setPhoneVerified(true);

      await completeIdentity(fullPhone);
    } catch (err) {
      setError(
        readableError(err, 'Phone verification failed. Check the code and try again.')
      );
    } finally {
      setSending(false);
    }
  };

  const completeIdentity = async (verifiedPhone) => {
    setError('');

    const { normalizedLegalName } = validateContact();

    const currentAuthUser = await loadAuthUser();

    if (
      currentAuthUser.phone !== verifiedPhone ||
      !currentAuthUser.phone_confirmed_at
    ) {
      throw new Error(
        'Verify your phone number before completing your Xedruo identity.'
      );
    }

    const companySlug =
      localStorage.getItem('xedruo_oauth_company') || 'xedruo';

    const result = await saveCustomerContact({
      countryCode: country,
      phoneE164: verifiedPhone,
      legalName: normalizedLegalName,
      companySlug,
    });

    const current = await getIdentity();

    if (
      !current?.xedruo_id ||
      !current?.phone_verified_at ||
      !current?.legal_name
    ) {
      throw new Error(
        'Your Xedruo identity could not be confirmed. Please try again.'
      );
    }

    localStorage.removeItem('xedruo_pending_contact');

    setIdentity(current);
    setPhone(verifiedPhone);
    setPhoneVerified(true);
    setStep('complete');

    return result;
  };

  const continueAfterOnboarding = async () => {
    const saved = localStorage.getItem('xedruo_oauth_return_to');
    const from = location.state?.from;

    const safe = (value) =>
      typeof value === 'string' &&
      value.startsWith('/') &&
      !value.startsWith('//')
        ? value
        : null;

    const destination = safe(saved) || safe(from) || '/';

    const company = String(
      localStorage.getItem('xedruo_oauth_company') || ''
    )
      .trim()
      .toLowerCase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    localStorage.removeItem('xedruo_oauth_return_to');
    localStorage.removeItem('xedruo_oauth_company');

    if (handoffToCompany(session, company, destination)) return;

    navigate(destination, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (step === 'complete' && identity) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="Your Xedruo account is ready"
        subtitle="Your central Xedruo identity can be used across connected company applications."
      >
        <div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />

            <div>
              <p className="font-semibold">Your Xedruo ID</p>
              <p className="text-2xl font-bold tracking-widest">
                {identity.xedruo_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4" />
            {identity.phone_e164}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Phone number verified
          </div>

          <p className="text-sm text-muted-foreground">
            Your phone number is verified and attached to your central Xedruo
            identity. Your identity can now be used across connected Xedruo
            services. Regional KYC can be completed when required.
          </p>
        </div>

        <Button
          className="w-full h-12 mt-4"
          onClick={continueAfterOnboarding}
        >
          Continue to Xedruo
        </Button>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout
        icon={Phone}
        title="Verify your phone number"
        subtitle={`Enter the 6-digit SMS code sent to ${getFullPhone()}.`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-muted/30 p-4 mb-6 text-sm">
          <p className="font-semibold">Check your SMS messages</p>
          <p className="text-muted-foreground mt-1">
            We need to verify your phone number before issuing or completing
            your Xedruo identity.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            autoFocus
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full h-12"
          onClick={verifyPhone}
          disabled={sending || otp.length !== 6}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify phone number'
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full mt-3"
          disabled={sending}
          onClick={() => {
            setError('');
            setOtp('');
            setStep('contact');
          }}
        >
          Change phone number
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Complete your Xedruo account"
      subtitle="Confirm your legal name, issuing country and verified phone number to complete your central Xedruo identity."
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-legal-name">Full legal name</Label>

          <Input
            id="onboarding-legal-name"
            autoComplete="name"
            placeholder="Enter your full legal name"
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            required
            maxLength={160}
          />
        </div>

        <div className="space-y-2">
          <Label>Issuing country</Label>

          <Input
            placeholder="Search country..."
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
            disabled={countryLocked}
          />

          <select
            aria-label="Select issuing country"
            className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm"
            value={country}
            disabled={countryLocked}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="">Select country</option>

            {filteredCountries.map((item) => (
              <option key={item.code} value={item.code}>
                {countryFlag(item.code)} {item.name}
              </option>
            ))}
          </select>

          {countryLocked && (
            <p className="text-xs text-muted-foreground">
              Your existing Xedruo identity has an issuing country that cannot
              be changed.
            </p>
          )}
        </div>

        {dialCode && (
          <div className="space-y-2">
            <Label htmlFor="onboarding-calling-code">
              Country calling code
            </Label>

            <Input
              id="onboarding-calling-code"
              readOnly
              value={dialCode}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="onboarding-phone">Phone number</Label>

          <div className="flex gap-2">
            <div className="w-24 shrink-0 flex items-center justify-center rounded-md border bg-muted/40 font-semibold text-sm">
              {dialCode || '+'}
            </div>

            <Input
              id="onboarding-phone"
              type="tel"
              autoComplete="tel"
              placeholder="8012345678"
              value={
                phone.startsWith(dialCode)
                  ? phone.slice(dialCode.length)
                  : phone
              }
              onChange={(event) => {
                setPhone(
                  dialCode +
                    digitsOnly(event.target.value).replace(/^0/, '')
                );

                setPhoneVerified(false);
              }}
              disabled={sending}
            />
          </div>
        </div>

        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          {phoneVerified ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              This phone number is verified with Xedruo authentication.
            </span>
          ) : (
            'We will send an SMS verification code before completing your Xedruo identity.'
          )}
        </div>

        <Button
          className="w-full h-12"
          onClick={sendPhoneVerification}
          disabled={
            sending ||
            !legalName.trim() ||
            !country ||
            !dialCode ||
            !phone.trim()
          }
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {phoneVerified ? 'Completing identity...' : 'Sending code...'}
            </>
          ) : phoneVerified ? (
            'Complete Xedruo identity'
          ) : (
            'Send verification code'
          )}
        </Button>
      </div>
    </AuthLayout>
  );
}