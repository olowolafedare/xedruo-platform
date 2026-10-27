import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { xedruo } from '@/api/xedruoClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LogIn, Mail, Loader2, KeyRound, Lock } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { toast } from '@/components/ui/use-toast';

import { appOrigin } from '@/lib/appOrigin';
const SPORTRUO_URL = 'https://sportruo-lcrv5o.v2.appdeploy.ai/';
const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';
const LOGOUT_RETURN_KEY = 'xedruo_logout_return_to';
const SAFE_RETURN_PATHS = new Set(['/','/company/adom','/adom','/company/sportruo','/sportruo','/company/sportruo/dashboard','/company/healthruo','/healthruo','/company/logistics','/logistics','/company/properties','/properties','/company/spacetruo','/spacetruo','/company/xedruo-ai','/xedruo-ai']);
const getSafeReturnPath = (value) => { if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null; const path = value.split('?')[0].split('#')[0]; if (SAFE_RETURN_PATHS.has(path) || /^\/company\/(sportruo|healthruo|logistics|properties|spacetruo)(\/dashboard)?$/.test(path)) return value; return null; };
const isSportruoReturn = (value) => { const path = getSafeReturnPath(value); if (!path) return false; const pathname = path.split('?')[0].split('#')[0]; return pathname === '/company/sportruo' || pathname === '/sportruo' || pathname === '/company/sportruo/dashboard'; };
const handoffToSportruo = (data) => { if (!data?.access_token) return false; const hash = new URLSearchParams({ access_token: data.access_token, refresh_token: data.refresh_token || '', token_type: data.token_type || 'bearer', expires_in: String(data.expires_in || 3600) }); window.location.replace(`${SPORTRUO_URL}#${hash.toString()}`); return true; };

export default function Login() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const company = params.get('company');
  const requestedReturnTo = getSafeReturnPath(params.get('returnTo'));
  const savedReturnTo = getSafeReturnPath(localStorage.getItem(LOGOUT_RETURN_KEY));
  const sportruoContext = company === 'sportruo' || isSportruoReturn(requestedReturnTo) || isSportruoReturn(savedReturnTo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mode, setMode] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const destination = sportruoContext ? SPORTRUO_URL : requestedReturnTo || savedReturnTo || (company ? `/company/${encodeURIComponent(company)}/dashboard` : '/');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const result = await xedruo.auth.loginViaEmailPassword(email, password); localStorage.removeItem(LOGOUT_RETURN_KEY); if (sportruoContext && handoffToSportruo(result)) return; window.location.href = destination; }
    catch (err) { setError(err.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!email.trim()) { setError('Enter your email address first'); return; }
    setError(''); setLoading(true);
    try { await xedruo.auth.sendLoginOtp(email.trim()); setMode('otp'); toast({ title: 'Verification code sent', description: `Check ${email.trim()} for your Xedruo code.` }); }
    catch (err) { setError(err.message || 'Could not send verification code'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) { setError('Enter the 6-digit verification code'); return; }
    setError(''); setLoading(true);
    try { const result = await xedruo.auth.verifyLoginOtp(email.trim(), otpCode); localStorage.removeItem(LOGOUT_RETURN_KEY); if (sportruoContext && handoffToSportruo(result)) return; window.location.href = destination; }
    catch (err) { setError(err.message || 'Invalid or expired verification code'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      localStorage.setItem(AUTH_RETURN_KEY, destination);
      if (sportruoContext) localStorage.setItem('xedruo_oauth_company', 'sportruo'); else if (company) localStorage.setItem('xedruo_oauth_company', company);
      const callback = new URL('/auth/callback', appOrigin()); if (sportruoContext) callback.searchParams.set('company', 'sportruo'); await xedruo.auth.loginWithProvider('google', { redirectTo: callback.toString() });
    } catch (err) { localStorage.removeItem(AUTH_RETURN_KEY); localStorage.removeItem('xedruo_oauth_company'); setError(err.message || 'Google sign-in failed'); setLoading(false); }
  };

  if (mode === 'otp') return <AuthLayout icon={KeyRound} title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`} footer={<button onClick={() => { setMode('password'); setOtpCode(''); setError(''); }} className="text-primary font-medium hover:underline">Use another sign-in method</button>}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <div className="flex justify-center mb-6"><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code"><InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
    <Button className="w-full h-12 font-medium" onClick={verifyOtp} disabled={loading || otpCode.length !== 6}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify & continue'}</Button>
    <button onClick={sendOtp} disabled={loading} className="w-full mt-4 text-sm text-primary font-medium hover:underline">Resend code</button>
  </AuthLayout>;

  return <AuthLayout icon={LogIn} title="Welcome back" subtitle="Log in to your account" footer={<>{"Don't have an account? "}<Link to={`/register${sportruoContext ? '?company=sportruo' : company ? `?company=${encodeURIComponent(company)}` : ''}`} className="text-primary font-medium hover:underline">Create one</Link></>}>
    <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle} disabled={loading}><GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google</Button>
    <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">OR</span></div></div>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-12" required /></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link></div><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-12" required /></div></div>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in...</> : 'Log in'}</Button>
    </form>
  </AuthLayout>;
}
