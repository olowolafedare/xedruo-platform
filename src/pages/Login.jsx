
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { xedruo, supabase } from '@/api/xedruoClient';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
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

const isIdentityComplete = (identity, user) => {
  if (!identity || !user) return false;

  return (
    Boolean(identity.xedruo_id) &&
    Boolean(identity.country_code) &&
    Boolean(identity.legal_name?.trim()) &&
    Boolean(identity.phone_e164)
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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(
    params.get('prompt') !== 'login'
  );

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
            'xedruo_id,country_code,legal_name,phone_e164,phone_verified_at,status'
          )
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (identityError) throw identityError;

        if (!alive) return;

        if (identity?.status === 'suspended') {
          await supabase.auth.signOut();

          if (alive) {
            setError(
              'This Xedruo identity is suspended. Please contact support.'
            );
          }

          return;
        }

        if (!isIdentityComplete(identity, session.user)) {
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
      } catch (err) {
        if (alive) {
          setError(
            err.message || 'Unable to verify your Xedruo account.'
          );
        }
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

  return (
    <AuthLayout
      icon={LogIn}
      title="Get started"
      subtitle="Login or create your Xedruo account to continue."
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

    </AuthLayout>
  );
}
