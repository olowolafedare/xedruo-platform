import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { xedruo, supabase } from '@/api/xedruoClient';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { LogIn, KeyRound, Phone } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { appOrigin } from '@/lib/appOrigin';
import { handoffToCompany } from '@/lib/companyHandoff';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';
const LOGOUT_RETURN_KEY = 'xedruo_logout_return_to';

const SAFE_RETURN_PATHS = new Set([
  '/',
  '/company/adom',
  '/adom',
  '/company/sportruo',
  '/sportruo',
  '/company/sportruo/dashboard',
  '/company/healthruo',
  '/healthruo',
  '/company/logistics',
  '/logistics',
  '/company/properties',
  '/properties',
  '/company/spacetruo',
  '/spacetruo',
  '/company/xedruo-ai',
  '/xedruo-ai',
  '/xedrion-ai',
  '/company/xedrion-ai',
  '/company/pay-bank',
  '/pay-and-play',
  '/company/music',
  '/distribution',
  '/hireuo',
]);

const getSafeReturnPath = (value) => {
  if (
    !value ||
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return null;
  }

  const path = value.split('?')[0].split('#')[0];

  if (
    SAFE_RETURN_PATHS.has(path) ||
    /^\/company\/(sportruo|healthruo|logistics|properties|spacetruo|pay-bank|music|adom|xedrion-ai|xedruo-ai)(\/dashboard)?$/.test(
      path
    )
  ) {
    return value;
  }

  return null;
};

const isSportruoReturn = (value) => {
  const path = getSafeReturnPath(value);

  if (!path) return false;

  const pathname = path.split('?')[0].split('#')[0];

  return (
    pathname === '/company/sportruo' ||
    pathname === '/sportruo' ||
    pathname === '/company/sportruo/dashboard'
  );
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const company = params.get('company');

  const requestedReturnTo = getSafeReturnPath(params.get('returnTo'));
  const savedReturnTo = getSafeReturnPath(
    localStorage.getItem(LOGOUT_RETURN_KEY)
  );

  const sportruoContext =
    company === 'sportruo' ||
    isSportruoReturn(requestedReturnTo) ||
    isSportruoReturn(savedReturnTo);

  const destination =
    requestedReturnTo ||
    savedReturnTo ||
    (company ? `/company/${encodeURIComponent(company)}` : '/');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState('options');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(params.get('prompt') !== 'login');

  const handleGoogle = async () => {
    setError('');
    setLoading(true);

    try {
      localStorage.setItem(AUTH_RETURN_KEY, destination);

      if (sportruoContext) {
        localStorage.setItem('xedruo_oauth_company', 'sportruo');
      } else if (company) {
        localStorage.setItem('xedruo_oauth_company', company);
      }

      const callback = new URL('/auth/callback', appOrigin());

      if (company) {
        callback.searchParams.set('company', company);
      }

      await xedruo.auth.loginWithProvider('google', {
        redirectTo: callback.toString(),
      });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const sendCode = async () => {
    const value = phone.trim();

    if (!/^\+[1-9]\d{7,14}$/.test(value)) {
      setError(
        'Enter your full phone number with country code, e.g. +2348012345678.'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      await xedruo.auth.sendPhoneLoginOtp(value);
      setMode('otp');
    } catch (err) {
      setError(err.message || 'Could not send phone verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await xedruo.auth.verifyPhoneLoginOtp(
        phone.trim(),
        otp
      );

      if (result?.error) {
        throw result.error;
      }

    
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const session =
        result?.session ||
        result?.data?.session ||
        sessionData?.session;

      if (!session?.user) {
        throw new Error(
          'Phone verification succeeded, but no login session was established. Please try signing in again.'
        );
      }

      localStorage.removeItem(LOGOUT_RETURN_KEY);
      sessionStorage.removeItem('xedruo_handoff_attempt');

      if (handoffToCompany(session, company, destination)) return;

      window.location.href = destination.startsWith('/company/')
        ? '/'
        : destination;
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const checkExistingSession = async () => {
      try {
        const currentParams = new URLSearchParams(location.search);

        if (currentParams.get('prompt') === 'login') {
          await supabase.auth.signOut();
          sessionStorage.removeItem('xedruo_handoff_attempt');
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user || !alive) return;

        const { data: identity, error: identityError } = await supabase
          .from('xedruo_identity')
          .select(
            'xedruo_id,country_code,legal_name,phone_e164,phone_verified_at'
          )
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (identityError) throw identityError;

        const authPhoneVerified =
          Boolean(session.user.phone) &&
          Boolean(session.user.phone_confirmed_at);

        const identityComplete =
          Boolean(identity?.xedruo_id) &&
          Boolean(identity?.country_code) &&
          Boolean(identity?.legal_name?.trim()) &&
          Boolean(identity?.phone_e164) &&
          Boolean(identity?.phone_verified_at) &&
          authPhoneVerified &&
          identity.phone_e164 === session.user.phone;

        if (!identityComplete) {
          localStorage.setItem(AUTH_RETURN_KEY, destination);

          if (company) {
            localStorage.setItem('xedruo_oauth_company', company);
          }

          navigate('/onboarding', {
            replace: true,
            state: { from: destination },
          });

          return;
        }

        if (sessionStorage.getItem('xedruo_handoff_attempt')) return;

        sessionStorage.setItem('xedruo_handoff_attempt', '1');

        if (handoffToCompany(session, company, destination)) return;

        navigate(
          destination.startsWith('/company/') ? '/' : destination,
          { replace: true }
        );
      } catch {
        // If session or identity lookup fails, show the login form---Bright Emmanuel Emeka
      } finally {
        if (alive) setChecking(false);
      }
    };

    checkExistingSession();

    return () => {
      alive = false;
    };
  }, [location.search, destination, company, navigate]);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const footer = (
    <button
      onClick={() => {
        setMode('options');
        setOtp('');
        setError('');
      }}
      className="text-primary font-medium hover:underline"
    >
      Back to sign-in options
    </button>
  );

  if (mode === 'otp') {
    return (
      <AuthLayout
        icon={KeyRound}
        title="Verify your phone"
        subtitle={`Enter the code sent to ${phone}`}
        footer={footer}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full h-12"
          onClick={verifyCode}
          disabled={loading || otp.length !== 6}
        >
          {loading ? 'Verifying…' : 'Verify and continue'}
        </Button>

        <button
          onClick={sendCode}
          className="w-full mt-4 text-sm text-primary"
          disabled={loading}
        >
          Resend code
        </button>
      </AuthLayout>
    );
  }

  if (mode === 'phone') {
    return (
      <AuthLayout
        icon={Phone}
        title="Continue with phone"
        subtitle="Use the phone number already linked to your Xedruo account."
        footer={footer}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Label htmlFor="xedruo-login-phone">
          Phone number with country code
        </Label>

        <Input
          id="xedruo-login-phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+2348012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-2 h-12"
        />

        <Button
          className="w-full h-12 mt-5"
          onClick={sendCode}
          disabled={loading || !phone.trim()}
        >
          {loading ? 'Sending code…' : 'Send verification code'}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to your Xedruo account"
      footer={
        <>
          {"Don't have an account? "}
          <Link
            to={`/register${
              sportruoContext
                ? '?company=sportruo'
                : company
                  ? `?company=${encodeURIComponent(company)}`
                  : ''
            }`}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full h-12 mb-4"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-12"
        onClick={() => setMode('phone')}
        disabled={loading}
      >
        Continue with phone number
      </Button>
    </AuthLayout>
  );
}