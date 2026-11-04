import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/xedruoClient';
import { saveCustomerContact } from '@/lib/xedruoIdentity';
import { handoffToCompany } from '@/lib/companyHandoff';

const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';
const safeReturnPath = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';

async function completeOAuthSession() {
  const url = new URL(window.location.href);
  const existing = await supabase.auth.getSession();
  if (existing.data?.session?.user) return existing.data.session;
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (oauthError) throw new Error(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
  if (!code) throw new Error('Google did not return an authorization code.');
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  if (!data?.session?.user) throw new Error('Google sign-in completed without an active session.');
  return data.session;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const finish = async () => {
      try {
        const session = await completeOAuthSession();
        const pending = localStorage.getItem('xedruo_pending_contact');
        if (pending) {
          try {
            const contact = JSON.parse(pending);
            await saveCustomerContact(contact);
          } finally {
            localStorage.removeItem('xedruo_pending_contact');
          }
        }
        const url = new URL(window.location.href);
        const company = url.searchParams.get('company') || localStorage.getItem('xedruo_oauth_company');
        const pendingSportruoRole = localStorage.getItem('sportruo_registration_role');
        if (company === 'sportruo' && ['fan', 'participant'].includes(pendingSportruoRole)) {
          const { error: roleError } = await supabase.auth.updateUser({ data: { sportruo_role: pendingSportruoRole } });
          if (roleError) throw roleError;
          localStorage.removeItem('sportruo_registration_role');
        }
        const destination = safeReturnPath(localStorage.getItem(AUTH_RETURN_KEY));
        const { data: identity, error: identityError } = await supabase
          .from('xedruo_identity')
          .select('xedruo_id,phone_e164,phone_verified_at')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (identityError) throw identityError;
        if (!identity?.xedruo_id || !identity.phone_e164 || !identity.phone_verified_at) {
          localStorage.setItem(AUTH_RETURN_KEY, destination);
          if (company) localStorage.setItem('xedruo_oauth_company', company);
          if (active) navigate('/onboarding', { replace: true, state: { from: destination } });
          return;
        }
        localStorage.removeItem(AUTH_RETURN_KEY);
        localStorage.removeItem('xedruo_oauth_company');
        sessionStorage.removeItem('xedruo_handoff_attempt');
        if (handoffToCompany(session, company, destination)) return;
        if (active) navigate(destination, { replace: true });
      } catch (err) {
        if (!active) return;
        const message = String(err?.message || 'Google sign-in could not be completed.');
        if (/code verifier|pkce/i.test(message)) {
          localStorage.removeItem(AUTH_RETURN_KEY);
          localStorage.removeItem('xedruo_oauth_company');
          setError('This sign-in session expired or was opened in another browser. Please start Google sign-in again.');
        } else setError(message);
      }
    };
    finish();
    return () => { active = false; };
  }, [navigate]);
  if (error) return <main className="min-h-screen flex items-center justify-center px-6"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">Sign-in could not be completed</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><button className="mt-6 text-sm font-medium underline" onClick={() => navigate('/login', { replace: true })}>Start sign-in again</button></div></main>;
  return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
}
