import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { xedruo } from '@/api/xedruoClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LogIn, Mail, Lock, Loader2, KeyRound, Phone } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { toast } from '@/components/ui/use-toast';

const PRODUCTION_ORIGIN = 'https://xedruo-platform.vercel.app';
const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';

export default function Login() {
  const location = useLocation();
  const company = new URLSearchParams(location.search).get('company');
  const destination = company === 'pay-and-play' ? '/pay-and-play/app' : company ? `/company/${encodeURIComponent(company)}/dashboard` : '/dashboard';
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mode, setMode] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTarget, setOtpTarget] = useState('email');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await xedruo.auth.loginViaEmailPassword(email, password); window.location.href = destination; }
    catch (err) { setError(err.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!email.trim()) { setError('Enter your email address first'); return; }
    setError(''); setLoading(true);
    try { await xedruo.auth.sendLoginOtp(email.trim()); setOtpTarget('email'); setMode('otp'); toast({ title: 'Verification code sent', description: `Check ${email.trim()} for your Xedruo code.` }); }
    catch (err) { setError(err.message || 'Could not send verification code'); }
    finally { setLoading(false); }
  };

  const sendPhoneOtp = async () => {
    setError(''); setLoading(true);
    try { await xedruo.auth.sendPhoneLoginOtp(phone.trim()); setOtpTarget('phone'); setMode('otp'); toast({ title: 'Phone verification code sent', description: `Check ${phone.trim()} for your Xedruo code.` }); }
    catch (err) { setError(err.message || 'Could not send phone verification code'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) { setError('Enter the 6-digit verification code'); return; }
    setError(''); setLoading(true);
    try {
      if (otpTarget === 'phone') await xedruo.auth.verifyPhoneLoginOtp(phone.trim(), otpCode);
      else await xedruo.auth.verifyLoginOtp(email.trim(), otpCode);
      window.location.href = destination;
    } catch (err) { setError(err.message || 'Invalid or expired verification code'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      localStorage.setItem(AUTH_RETURN_KEY, destination);
      if (company) localStorage.setItem('xedruo_oauth_company', company);
      if (isLocalHost) { const target = new URL('/login', PRODUCTION_ORIGIN); if (company) target.searchParams.set('company', company); window.location.replace(target.toString()); return; }
      await xedruo.auth.loginWithProvider('google');
    } catch (err) {
      localStorage.removeItem(AUTH_RETURN_KEY); localStorage.removeItem('xedruo_oauth_company'); setError(err.message || 'Google sign-in failed'); setLoading(false);
    }
  };

  if (mode === 'otp') return (
    <AuthLayout icon={KeyRound} title={`Verify your ${otpTarget === 'phone' ? 'phone' : 'email'}`} subtitle={`We sent a 6-digit code to ${otpTarget === 'phone' ? phone : email}`} footer={<button onClick={() => { setMode('password'); setOtpCode(''); setError(''); }} className='text-primary font-medium hover:underline'>Use another sign-in method</button>}>
      {error && <div className='mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm'>{error}</div>}
      <div className='flex justify-center mb-6'><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete='one-time-code'><InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
      <Button className='w-full h-12 font-medium' onClick={verifyOtp} disabled={loading || otpCode.length !== 6}>{loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Verifying...</> : 'Verify & continue'}</Button>
      <button onClick={otpTarget === 'phone' ? sendPhoneOtp : sendOtp} disabled={loading} className='w-full mt-4 text-sm text-primary font-medium hover:underline'>Resend code</button>
    </AuthLayout>
  );

  return (
    <AuthLayout icon={LogIn} title='Welcome back' subtitle={company === 'pay-and-play' ? 'Log in to Xedruo Pay & Play' : company ? `Log in to ${company}` : 'Log in to your account'} footer={<>
      Don't have an account? <Link to={`/register${company ? `?company=${encodeURIComponent(company)}` : ''}`} className='text-primary font-medium hover:underline'>Create one</Link>
    </>}>
      <Button variant='outline' className='w-full h-12 text-sm font-medium mb-6' onClick={handleGoogle} disabled={loading}><GoogleIcon className='w-5 h-5 mr-2' /> Continue with Google</Button>
      <div className='relative mb-6'><div className='absolute inset-0 flex items-center'><div className='w-full border-t border-border' /></div><div className='relative flex justify-center text-xs uppercase'><span className='bg-card px-3 text-muted-foreground'>or</span></div></div>
      {error && <div className='mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm'>{error}</div>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'><Label htmlFor='email'>Email</Label><div className='relative'><Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' aria-hidden='true' /><Input id='email' type='email' autoComplete='email' placeholder='you@example.com' value={email} onChange={e => setEmail(e.target.value)} className='pl-10 h-12' /></div></div>
        <div className='space-y-2'><div className='flex items-center justify-between'><Label htmlFor='password'>Password</Label><Link to='/forgot-password' className='text-xs text-primary hover:underline'>Forgot password?</Link></div><div className='relative'><Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' aria-hidden='true' /><Input id='password' type='password' autoComplete='current-password' placeholder='••••••••' value={password} onChange={e => setPassword(e.target.value)} className='pl-10 h-12' required /></div></div>
        <Button type='submit' className='w-full h-12 font-medium' disabled={loading}>{loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Logging in...</> : 'Log in'}</Button>
      </form>
      <div className='mt-5 pt-5 border-t border-border space-y-3'>
        <div className='text-sm font-medium'>Sign in with phone</div>
        <div className='relative'><Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' aria-hidden='true' /><Input type='tel' inputMode='tel' autoComplete='tel' placeholder='+2348012345678' value={phone} onChange={e => setPhone(e.target.value)} className='pl-10 h-12' /></div>
        <Button type='button' variant='outline' className='w-full h-12' onClick={sendPhoneOtp} disabled={loading || !phone.trim()}>{loading ? <><Loader2 className='w-4 h-4 mr-2 animate-spin' />Sending...</> : 'Send phone code'}</Button>
      </div>
      <button onClick={sendOtp} disabled={loading || !email.trim()} className='w-full mt-4 text-sm font-medium text-primary hover:underline disabled:opacity-50'>Sign in with email code instead</button>
    </AuthLayout>
  );
}
