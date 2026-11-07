import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Ticket,
  UserRound,
  Phone,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

import { xedruo, supabase } from '@/api/xedruoClient';
import { safeReturnTo } from '@/lib/authReturnTo';
import { COUNTRIES } from '@/data/countries';

const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';
const SPORTRUO_URL = 'https://sportruo.vercel.app/';

const DIAL_CODES = {
  NG: '+234', US: '+1', CA: '+1', GB: '+44', GH: '+233',
  ZA: '+27', KE: '+254', AU: '+61', IN: '+91', DE: '+49',
  FR: '+33', AE: '+971', SA: '+966', CN: '+86', JP: '+81',
  BR: '+55', EG: '+20', NZ: '+64', IE: '+353', IT: '+39',
  ES: '+34', NL: '+31', BE: '+32', CH: '+41', SE: '+46',
  NO: '+47', DK: '+45', FI: '+358', PL: '+48', PT: '+351',
  TR: '+90', RU: '+7', UA: '+380', PK: '+92', BD: '+880',
  ID: '+62', MY: '+60', SG: '+65', TH: '+66', PH: '+63',
  VN: '+84', KR: '+82', IL: '+972', QA: '+974', KW: '+965',
  BH: '+973', OM: '+968', JO: '+962', LB: '+961', IR: '+98',
  MX: '+52', AR: '+54', CL: '+56', CO: '+57', PE: '+51',
  VE: '+58', EC: '+593', UG: '+256', TZ: '+255', RW: '+250',
  ET: '+251', SN: '+221', CI: '+225', CM: '+237', AO: '+244',
  ZM: '+260', ZW: '+263', MA: '+212', TN: '+216', DZ: '+213',
  LY: '+218', SD: '+249', SS: '+211', BW: '+267', NA: '+264',
  MU: '+230', MG: '+261', GM: '+220', SL: '+232', LR: '+231',
  BJ: '+229', TG: '+228', NE: '+227', BF: '+226', GA: '+241',
  CG: '+242', CD: '+243', CF: '+236', TD: '+235', ER: '+291',
  SO: '+252', DJ: '+253', MW: '+265', LS: '+266', SZ: '+268',
  KM: '+269', CV: '+238', GW: '+245', GQ: '+240', ST: '+239',
  MR: '+222', BI: '+257', AF: '+93', AL: '+355', AD: '+376',
  AG: '+1', AM: '+374', AT: '+43', AZ: '+994', BS: '+1',
  BB: '+1', BY: '+375', BZ: '+501', BT: '+975', BO: '+591',
  BA: '+387', BN: '+673', BG: '+359', KH: '+855', CR: '+506',
  HR: '+385', CY: '+357', CZ: '+420', DM: '+1', DO: '+1',
  SV: '+503', EE: '+372', FJ: '+679', GE: '+995', GR: '+30',
  GD: '+1', GT: '+502', GN: '+224', GY: '+592', HT: '+509',
  HN: '+504', HU: '+36', IS: '+354', IQ: '+964', JM: '+1',
  KZ: '+7', KI: '+686', KP: '+850', KG: '+996', LA: '+856',
  LV: '+371', LI: '+423', LT: '+370', LU: '+352', MV: '+960',
  ML: '+223', MT: '+356', MH: '+692', FM: '+691', MD: '+373',
  MC: '+377', MN: '+976', ME: '+382', MZ: '+258', MM: '+95',
  NR: '+674', NP: '+977', NI: '+505', MK: '+389', PW: '+680',
  PS: '+970', PG: '+675', PY: '+595', RO: '+40', KN: '+1',
  LC: '+1', VC: '+1', WS: '+685', SM: '+378', SC: '+248',
  SK: '+421', SI: '+386', SB: '+677', LK: '+94', SR: '+597',
  SY: '+963', TJ: '+992', TL: '+670', TO: '+676', TT: '+1',
  TM: '+993', TV: '+688', UY: '+598', UZ: '+998', VU: '+678',
  VA: '+39', YE: '+967',
};

const digitsOnly = (value) =>
  String(value || '').replace(/\D/g, '');

const countryFlag = (code) =>
  [...String(code || '').toUpperCase()]
    .map((character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0))
    )
    .join('');

const readableError = (err) =>
  typeof err?.message === 'string' && err.message.trim()
    ? err.message
    : 'Something went wrong. Please try again.';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const company = params.get('company');

  const requestedReturnTo = params.has('returnTo')
    ? safeReturnTo()
    : null;

  const destination =
    company === 'sportruo'
      ? SPORTRUO_URL
      : requestedReturnTo ||
        (company
          ? `/company/${encodeURIComponent(company)}/dashboard`
          : '/');

  const loginUrl = '/login' + (company
    ? `?company=${encodeURIComponent(company)}`
    : '');

  const [role, setRole] = useState(
    params.get('role') === 'participant' ? 'participant' : 'fan'
  );

  const [country, setCountry] = useState('NG');
  const [countrySearch, setCountrySearch] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState('register');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fullPhone = () => {
    const localNumber = digitsOnly(phone).replace(/^0/, '');
    return `${dialCode}${localNumber}`;
  };

  const saveRegistrationContext = () => {
    localStorage.setItem(AUTH_RETURN_KEY, destination);

    if (company) {
      localStorage.setItem('xedruo_oauth_company', company);
    }

    if (company === 'sportruo') {
      localStorage.setItem('sportruo_registration_role', role);
    }
  };

  const validateRegistration = () => {
    if (!country || !dialCode) {
      throw new Error('Select your country.');
    }

    const number = fullPhone();

    if (!/^\+[1-9][0-9]{7,14}$/.test(number)) {
      throw new Error('Enter a valid phone number.');
    }

    if (password.length < 8) {
      throw new Error('Your password must contain at least 8 characters.');
    }

    if (password !== confirmPassword) {
      throw new Error('Your passwords do not match.');
    }

    return number;
  };

  const register = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const number = validateRegistration();

      saveRegistrationContext();

      const data = await xedruo.auth.registerWithPhone({
        phone: number,
        password,
        countryCode: country,
      });

      const registeredUser = data?.session?.user;

      if (
        registeredUser?.phone === number &&
        registeredUser?.phone_confirmed_at
      ) {
        navigate('/onboarding', {
          replace: true,
          state: { from: destination },
        });
        return;
      }


      setPendingPhone(number);
      setOtp('');
      setStep('otp');
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyRegistration = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!pendingPhone) {
        throw new Error('Registration phone number is missing. Please restart registration.');
      }

      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Enter the complete 6-digit verification code.');
      }

      await xedruo.auth.verifyPhoneSignupOtp(pendingPhone, otp);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const verifiedUser = sessionData?.session?.user;

      if (
        !verifiedUser ||
        verifiedUser.phone !== pendingPhone ||
        !verifiedUser.phone_confirmed_at
      ) {
        throw new Error(
          'Phone verification could not be confirmed. Please sign in or try again.'
        );
      }

      navigate('/onboarding', {
        replace: true,
        state: { from: destination },
      });
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setLoading(true);

    try {
      if (!pendingPhone) {
        throw new Error('Registration phone number is missing.');
      }

      await xedruo.auth.resendPhoneSignupOtp(pendingPhone);
      setOtp('');
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={step === 'otp' ? Phone : UserPlus}
      title={
        step === 'otp'
          ? 'Verify your phone number'
          : 'Create your Xedruo account'
      }
      subtitle={
        step === 'otp'
          ? `Enter the 6-digit SMS code sent to ${pendingPhone}.`
          : 'Register with your phone number and password. Your verified phone will be linked to your central Xedruo ID.'
      }
      footer={
        step === 'register' ? (
          <>
            Already have an account?{' '}
            <Link
              to={loginUrl}
              className="text-primary font-medium hover:underline"
            >
              Continue to login
            </Link>
          </>
        ) : (
          <>
            Already verified?{' '}
            <Link
              to={loginUrl}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </>
        )
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {company === 'sportruo' && step === 'register' && (
        <div className="mb-6">
          <Label>SPORTRUO experience</Label>

          <div className="grid grid-cols-2 gap-2 mt-2 p-1 rounded-xl bg-muted">
            <button
              type="button"
              onClick={() => setRole('fan')}
              className={
                'rounded-lg px-4 py-3 text-sm font-semibold ' +
                (role === 'fan' ? 'bg-background shadow-sm' : '')
              }
            >
              <span className="inline-flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Fan
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole('participant')}
              className={
                'rounded-lg px-4 py-3 text-sm font-semibold ' +
                (role === 'participant' ? 'bg-background shadow-sm' : '')
              }
            >
              <span className="inline-flex items-center gap-2">
                <UserRound className="w-4 h-4" />
                Participant
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'register' && (
        <form onSubmit={register} className="space-y-4">
          <div className="space-y-2">
            <Label>Country</Label>

            <Input
              placeholder="Search country..."
              value={countrySearch}
              onChange={(event) =>
                setCountrySearch(event.target.value)
              }
            />

            <select
              aria-label="Select country"
              className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setPhone('');
              }}
            >
              <option value="">Select country</option>

              {filteredCountries.map((item) => (
                <option key={item.code} value={item.code}>
                  {countryFlag(item.code)} {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-phone">Phone number</Label>

            <div className="flex gap-2">
              <div className="w-24 shrink-0 flex items-center justify-center rounded-md border bg-muted/40 font-semibold text-sm">
                {dialCode || '+'}
              </div>

              <Input
                id="register-phone"
                type="tel"
                autoComplete="tel-national"
                placeholder="8012345678"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    digitsOnly(event.target.value).replace(/^0/, '')
                  )
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>

            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">
              Confirm password
            </Label>

            <Input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={8}
              required
            />
          </div>

          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            <ShieldCheck className="inline w-4 h-4 mr-2" />
            We'll verify your phone number with an SMS code before
            completing your Xedruo account.
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyRegistration} className="space-y-5">
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="font-semibold">Check your SMS messages</p>
            <p className="text-muted-foreground mt-1">
              We sent a verification code to {pendingPhone}. Enter it below
              to activate your Xedruo account.
            </p>
          </div>

          <div className="flex justify-center">
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
            type="submit"
            className="w-full h-12"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify and continue'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={resendCode}
          >
            Resend verification code
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline"
            onClick={() => {
              setError('');
              setOtp('');
              setPendingPhone('');
              setStep('register');
            }}
          >
            Change registration details
          </button>
        </form>
      )}
    </AuthLayout>
  );
}