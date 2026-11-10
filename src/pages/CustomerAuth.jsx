import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { COUNTRIES } from '@/data/countries';

const API = '/api/auth';
const digits = (value) => String(value || '').replace(/\D/g, '');

export default function CustomerAuth() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const companySlug = (params.get('companySlug') || '').trim().toLowerCase();
  const callbackUrl = params.get('callbackUrl') || '';
  const state = params.get('state') || '';
  const codeChallenge = params.get('codeChallenge') || '';
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState('NG');
  const [phone, setPhone] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(API + '/countries?companySlug=' + encodeURIComponent(companySlug), { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not load countries.');
        if (active) setCountries(Array.isArray(data.countries) ? data.countries : []);
      })
      .catch((cause) => { if (active) setError(cause.message || 'Could not load countries.'); });
    return () => { active = false; };
  }, [companySlug]);

  const selectedCountry = countries.find((item) => item.country_code === country);
  const phoneE164 = selectedCountry ? selectedCountry.calling_code + digits(phone).replace(/^0/, '') : '';

  function validateContext() {
    if (!companySlug || !callbackUrl || !state || !codeChallenge) throw new Error('This sign-in link is incomplete. Return to the company website and tap Get Started again.');
    const callback = new URL(callbackUrl);
    if (callback.protocol !== 'https:') throw new Error('The company return address is invalid.');
  }

  function startGoogle(registration) {
    validateContext();
    const url = new URL(API + '/google/start', window.location.origin);
    url.searchParams.set('companySlug', companySlug);
    url.searchParams.set('callbackUrl', callbackUrl);
    url.searchParams.set('state', state);
    url.searchParams.set('codeChallenge', codeChallenge);
    if (registration) {
      url.searchParams.set('countryCode', country);
      url.searchParams.set('phoneE164', phoneE164);
      url.searchParams.set('legalName', legalName.trim());
    }
    window.location.assign(url.toString());
  }

  async function emailLogin(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      validateContext();
      const response = await fetch(API + '/id/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companySlug, login: email.trim(), password, callbackUrl, state, codeChallenge }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Email sign-in failed.');
      const destination = new URL(callbackUrl);
      destination.searchParams.set('code', data.code);
      destination.searchParams.set('state', data.state);
      window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Email sign-in failed.');
      setBusy(false);
    }
  }

  function createAccount(event) {
    event.preventDefault(); setError('');
    try {
      validateContext();
      if (!selectedCountry) throw new Error('Select your country.');
      if (!/^\+[1-9][0-9]{7,14}$/.test(phoneE164)) throw new Error('Enter a valid phone number.');
      if (legalName.trim().length < 3 || legalName.trim().length > 160) throw new Error('Enter your full legal name.');
      setBusy(true); startGoogle(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start registration.');
      setBusy(false);
    }
  }

  const companyLabel = companySlug ? companySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Xedruo company';
  const inputClass = 'mt-1 w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900';
  const primaryClass = 'w-full h-12 rounded-xl bg-slate-950 text-white font-semibold hover:bg-slate-800 disabled:opacity-60';
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-7">
          <div className="text-xs font-black tracking-[0.24em] text-slate-500">XEDRUO IDENTITY</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{mode === 'register' ? 'Create your Xedruo ID' : mode === 'email' ? 'Login with email' : 'Login'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{mode === 'register' ? 'Create one identity for all Xedruo companies. You will return to ' + companyLabel + '.' : 'Sign in once and continue to ' + companyLabel + '.'}</p>
        </div>
        {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {mode === 'register' ? (
          <form onSubmit={createAccount} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Country
              <select className={inputClass} value={country} onChange={(event) => setCountry(event.target.value)} required>
                {(countries.length ? countries : COUNTRIES.map((item) => ({ country_code: item.code, country_name: item.name, calling_code: '' }))).map((item) => <option key={item.country_code} value={item.country_code}>{item.country_name}{item.calling_code ? ' (' + item.calling_code + ')' : ''}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Phone number
              <div className="mt-1 flex gap-2"><span className="flex h-12 shrink-0 items-center rounded-xl border border-slate-300 bg-slate-100 px-3 text-slate-700">{selectedCountry?.calling_code || '+234'}</span><input className={inputClass.replace('mt-1 ', '')} inputMode="tel" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" required /></div>
            </label>
            <label className="block text-sm font-medium text-slate-700">Full legal name
              <input className={inputClass} autoComplete="name" value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="As shown on your official ID" required />
            </label>
            <button className={primaryClass} disabled={busy || !selectedCountry}>{busy ? 'Connecting to Google…' : 'Continue with Google (Gmail) to create ID'}</button>
            <p className="text-xs leading-5 text-slate-500">A Google account and phone number are required. SMS verification is not used. Your random 10-digit Xedruo ID is issued after Google confirms your account.</p>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full py-2 text-sm font-medium text-slate-600">Already have an account? Log in</button>
          </form>
        ) : mode === 'email' ? (
          <form onSubmit={emailLogin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Email address
              <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block text-sm font-medium text-slate-700">Password
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button className={primaryClass} disabled={busy}>{busy ? 'Signing in…' : 'Login with email'}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full py-2 text-sm text-slate-600">Back to login options</button>
          </form>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={() => { try { setBusy(true); setError(''); startGoogle(false); } catch (cause) { setError(cause.message); setBusy(false); } }} disabled={busy} className={primaryClass}>{busy ? 'Connecting…' : 'Continue with Google'}</button>
            <div className="flex items-center gap-3 py-2"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs uppercase tracking-wider text-slate-400">or</span><span className="h-px flex-1 bg-slate-200" /></div>
            <button type="button" onClick={() => { setMode('email'); setError(''); }} className="w-full h-12 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50">Email</button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} className="w-full py-2 text-sm font-medium text-slate-600">Create account</button>
          </div>
        )}
        <div className="mt-7 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">One Xedruo identity. Your company dashboard stays yours.</div>
      </section>
    </main>
  );
}
