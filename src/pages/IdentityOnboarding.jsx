
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

import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';
import { getIdentity, saveCustomerContact } from '@/lib/xedruoIdentity';
import { handoffToCompany } from '@/lib/companyHandoff';
import { COUNTRIES } from '@/data/countries';

const DIAL_CODES = {
  AF: '+93', AL: '+355', DZ: '+213', AD: '+376', AO: '+244', AG: '+1',
  AR: '+54', AM: '+374', AU: '+61', AT: '+43', AZ: '+994', BS: '+1',
  BH: '+973', BD: '+880', BB: '+1', BY: '+375', BE: '+32', BZ: '+501',
  BJ: '+229', BT: '+975', BO: '+591', BA: '+387', BW: '+267', BR: '+55',
  BN: '+673', BG: '+359', BF: '+226', BI: '+257', CV: '+238', KH: '+855',
  CM: '+237', CA: '+1', CF: '+236', TD: '+235', CL: '+56', CN: '+86',
  CO: '+57', KM: '+269', CG: '+242', CD: '+243', CR: '+506', CI: '+225',
  HR: '+385', CU: '+53', CY: '+357', CZ: '+420', DK: '+45', DJ: '+253',
  DM: '+1', DO: '+1', EC: '+593', EG: '+20', SV: '+503', GQ: '+240',
  ER: '+291', EE: '+372', SZ: '+268', ET: '+251', FJ: '+679', FI: '+358',
  FR: '+33', GA: '+241', GM: '+220', GE: '+995', DE: '+49', GH: '+233',
  GR: '+30', GD: '+1', GT: '+502', GN: '+224', GW: '+245', GY: '+592',
  HT: '+509', HN: '+504', HU: '+36', IS: '+354', IN: '+91', ID: '+62',
  IR: '+98', IQ: '+964', IE: '+353', IL: '+972', IT: '+39', JM: '+1',
  JP: '+81', JO: '+962', KZ: '+7', KE: '+254', KI: '+686', KP: '+850',
  KR: '+82', KW: '+965', KG: '+996', LA: '+856', LV: '+371', LB: '+961',
  LS: '+266', LR: '+231', LY: '+218', LI: '+423', LT: '+370', LU: '+352',
  MG: '+261', MW: '+265', MY: '+60', MV: '+960', ML: '+223', MT: '+356',
  MH: '+692', MR: '+222', MU: '+230', MX: '+52', FM: '+691', MD: '+373',
  MC: '+377', MN: '+976', ME: '+382', MA: '+212', MZ: '+258', MM: '+95',
  NA: '+264', NR: '+674', NP: '+977', NL: '+31', NZ: '+64', NI: '+505',
  NE: '+227', NG: '+234', MK: '+389', NO: '+47', OM: '+968', PK: '+92',
  PW: '+680', PS: '+970', PA: '+507', PG: '+675', PY: '+595', PE: '+51',
  PH: '+63', PL: '+48', PT: '+351', QA: '+974', RO: '+40', RU: '+7',
  RW: '+250', KN: '+1', LC: '+1', VC: '+1', WS: '+685', SM: '+378',
  ST: '+239', SA: '+966', SN: '+221', RS: '+381', SC: '+248', SL: '+232',
  SG: '+65', SK: '+421', SI: '+386', SB: '+677', SO: '+252', ZA: '+27',
  SS: '+211', ES: '+34', LK: '+94', SD: '+249', SR: '+597', SE: '+46',
  CH: '+41', SY: '+963', TJ: '+992', TZ: '+255', TH: '+66', TL: '+670',
  TG: '+228', TO: '+676', TT: '+1', TN: '+216', TR: '+90', TM: '+993',
  TV: '+688', UG: '+256', UA: '+380', AE: '+971', GB: '+44', US: '+1',
  UY: '+598', UZ: '+998', VU: '+678', VA: '+39', VE: '+58', VN: '+84',
  YE: '+967', ZM: '+260', ZW: '+263',
};

const sameTimestamp = (a, b) => {
  if (!a || !b) return false;

  return new Date(a).getTime() === new Date(b).getTime();
};

const countryFlag = (code) =>
  [...String(code || '').trim().toUpperCase()]
    .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    .join('');

const digitsOnly = (value) =>
  String(value || '').replace(/\D/g, '');

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

  const [step, setStep] = useState('contact');

  const [identity, setIdentity] = useState(null);
  const [countryLocked, setCountryLocked] = useState(false);
  const [suspended, setSuspended] = useState(false);

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
      throw new Error(
        'Your login session has expired. Please sign in again.'
      );
    }

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

        if (current?.status === 'suspended') {
          setSuspended(true);
          setIdentity(current);
          setError(
            'This Xedruo identity is suspended. Please contact support.'
          );
          return;
        }

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

        const complete =
          Boolean(current?.xedruo_id) &&
          Boolean(current?.country_code) &&
          Boolean(current?.legal_name?.trim()) &&
          Boolean(current?.phone_e164);

        setStep(complete ? 'complete' : 'contact');

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
    const normalizedCountry = String(country || '').trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      throw new Error('Select a valid issuing country.');
    }

    if (!dialCode) {
      throw new Error(
        'The selected country calling code is unavailable.'
      );
    }

    const normalizedLegalName = legalName.trim().replace(/\s+/g, ' ');

    if (
      normalizedLegalName.length < 3 ||
      normalizedLegalName.length > 160
    ) {
      throw new Error(
        'Enter your full legal name (3–160 characters).'
      );
    }

    const fullPhone = getFullPhone();

    if (!/^\+[1-9][0-9]{7,14}$/.test(fullPhone)) {
      throw new Error(
        `Enter a valid phone number for ${selected?.name || 'your country'}.`
      );
    }

    return {
      normalizedCountry,
      normalizedLegalName,
      fullPhone,
    };
  };

  const completeIdentity = async () => {
    setError('');
    const {
      normalizedCountry,
      normalizedLegalName,
      fullPhone,
    } = validateContact();

    const companySlug =
      localStorage.getItem('xedruo_oauth_company') || 'xedruo';

    const savedIdentity = await saveCustomerContact({
      countryCode: normalizedCountry,
      phoneE164: fullPhone,
      legalName: normalizedLegalName,
      companySlug,
    });

    if (savedIdentity?.status === 'suspended') {
      setSuspended(true);
      throw new Error(
        'This Xedruo identity is suspended. Please contact support.'
      );
    }

    if (
      !savedIdentity?.xedruo_id ||
      savedIdentity.country_code !== normalizedCountry ||
      savedIdentity.phone_e164 !== fullPhone ||
      savedIdentity.legal_name !== normalizedLegalName
    ) {
      throw new Error(
        'Your Xedruo identity could not be confirmed. Please try again.'
      );
    }

    localStorage.removeItem('xedruo_pending_contact');
    setIdentity(savedIdentity);
    setPhone(fullPhone);
    setStep('complete');
    return savedIdentity;
  };

  const sendPhoneVerification = async () => {
    setError('');
    setSending(true);
    try {
      await completeIdentity();
    } catch (err) {
      setError(
        readableError(err, 'Could not complete your Xedruo identity.')
      );
    } finally {
      setSending(false);
    }
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

  if (suspended) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="Identity suspended"
        subtitle="This Xedruo identity is currently suspended."
      >
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error ||
            'This Xedruo identity is suspended. Please contact support.'}
        </div>
      </AuthLayout>
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
            Phone number added
          </div>

          <p className="text-sm text-muted-foreground">
            Your phone number is attached to your central Xedruo identity.
            SMS verification is not required. Your identity can now be used
            across connected Xedruo services.
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

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Complete your Xedruo account"
      subtitle="Add your full legal name and phone number to create your central Xedruo identity."
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-legal-name">
            Full legal name
          </Label>

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

        {!identity?.country_code && <div className="space-y-2">
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

        </div>}

        {!identity?.country_code && dialCode && (
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
          <Label htmlFor="onboarding-phone">
            Phone number
          </Label>

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
              }}
              disabled={sending}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your phone number is required for your Xedruo identity. We will not
          send an SMS verification code.
        </p>

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
              Completing identity...
            </>
          ) : (
            'Complete Xedruo identity'
          )}
        </Button>
      </div>
    </AuthLayout>
  );
}
