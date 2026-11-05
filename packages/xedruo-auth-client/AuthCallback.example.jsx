// Example for a Vite/React company app (e.g. Healthruo). Lives in the PRODUCT repo.
// src/lib/xedruoAuth.js
//   import { createXedruoAuth } from '@xedruo/auth-client';
//   export const auth = createXedruoAuth({
//     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
//     supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
//     gatewayUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xedruo-auth-gateway`,
//     companySlug: 'healthruo',
//     dashboardPath: '/dashboard',
//   });

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/xedruoAuth';

// Route: /auth/callback  (must match allowed_callbacks in the registry + Supabase redirect URLs)
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    auth.handleCallback()
      .then((access) => navigate(auth.nextPath(access), { replace: true }))
      .catch((e) => setError(e.message)); // fail closed: show an error, never redirect elsewhere
  }, [navigate]);

  if (error) return <div><p>{error}</p><a href="/login">Back to sign in</a></div>;
  return <p>Signing you in…</p>;
}

// Route: /onboarding  (country, phone, legal name — asked once for the whole ecosystem)
export function Onboarding({ countries }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ countryCode: '', phoneE164: '', legalName: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const access = await auth.onboard(form);
      navigate(auth.nextPath(access), { replace: true });
    } catch (err) { setError(err.message); }
  };

  return (
    <form onSubmit={submit}>
      <select value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} required>
        <option value="">Country</option>
        {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      <input placeholder="+2348012345678" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} required />
      <input placeholder="Full legal name" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} required />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Continue</button>
    </form>
  );
}

// Login button: <button onClick={() => auth.signInWithGoogle({ returnTo: '/dashboard' })}>Continue with Google</button>
