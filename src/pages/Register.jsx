import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Ticket, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { xedruo, supabase } from '@/api/xedruoClient';

import { appOrigin } from '@/lib/appOrigin';
const SPORTRUO_URL = 'https://sportruo.vercel.app/';
const AUTH_RETURN_KEY = 'xedruo_oauth_return_to';

export default function Register() {
  const location = useLocation(); const navigate = useNavigate();
  const params = new URLSearchParams(location.search); const company = params.get('company'); const requestedReturnTo = getExternalReturnTo(params.get('returnTo'));
  const initialRole = params.get('role') === 'participant' ? 'participant' : 'fan';
  const [role,setRole]=useState(initialRole); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState('');
  const [showPassword,setShowPassword]=useState(false); const [showConfirm,setShowConfirm]=useState(false); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const destination = company === 'sportruo' ? SPORTRUO_URL : requestedReturnTo || (company ? `/company/${encodeURIComponent(company)}/dashboard` : '/');
  const saveSportruoRole = async () => { if (company !== 'sportruo') return; localStorage.setItem('sportruo_registration_role', role); try { await supabase.auth.updateUser({ data: { sportruo_role: role, sports_role: role } }); } catch (_) {} };
  const submit = async (e) => { e.preventDefault(); setError(''); if(password!==confirm){setError('Passwords do not match');return;} setLoading(true); try { localStorage.setItem(AUTH_RETURN_KEY,destination); const result=await xedruo.auth.register({email:email.trim(),password}); await saveSportruoRole(); if(result?.session) navigate('/onboarding',{replace:true}); else navigate(`/login${company?`?company=${encodeURIComponent(company)}`:''}`,{replace:true}); } catch(err){setError(err.message||'Registration failed');} finally{setLoading(false);} };
  const google = async () => { setError(''); setLoading(true); localStorage.setItem(AUTH_RETURN_KEY,destination); if(company==='sportruo') localStorage.setItem('sportruo_registration_role',role); try {  if(company==='sportruo'){window.location.assign(`${SPORTRUO_URL}?auth=google&role=${encodeURIComponent(role)}`);return;} const callback=new URL('/auth/callback',appOrigin()); await xedruo.auth.loginWithProvider('google',{redirectTo:callback.toString()}); } catch(err){setError(err.message||'Google sign-up failed');setLoading(false);} };
  return <AuthLayout icon={UserPlus} title="Create your Xedruo account" subtitle={company==='sportruo'?'Choose your SPORTRUO experience. Your registration determines whether you enter as a Fan or Participant.':'Start with Google or email. After registration, we will ask for your country and phone verification.'} footer={<>Already have an account? <Link to={`/login${company?`?company=${encodeURIComponent(company)}`:''}`} className="text-primary font-medium hover:underline">Log in</Link></>}>
    {company==='sportruo'&&<div className="mb-6"><Label>SPORTRUO experience</Label><div className="grid grid-cols-2 gap-2 mt-2 p-1 rounded-xl bg-muted"><button type="button" onClick={()=>setRole('fan')} className={`rounded-lg px-4 py-3 text-sm font-semibold ${role==='fan'?'bg-background shadow-sm':''}`}><span className="inline-flex items-center gap-2"><Ticket className="w-4 h-4"/> Fan</span></button><button type="button" onClick={()=>setRole('participant')} className={`rounded-lg px-4 py-3 text-sm font-semibold ${role==='participant'?'bg-background shadow-sm':''}`}><span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4"/> Participant</span></button></div><p className="mt-2 text-xs text-muted-foreground">Fan and Participant are different experiences after registration.</p></div>}
    <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={google} disabled={loading}><GoogleIcon className="w-5 h-5 mr-2"/>Continue with Google</Button>
    <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"/></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or email & password</span></div></div>
    {error&&<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} className="pl-10 h-12" required/></div></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id="password" type={showPassword?'text':'password'} autoComplete="new-password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="pl-10 pr-10 h-12" required/><button type="button" aria-label="Show password" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
      <div className="space-y-2"><Label htmlFor="confirm">Confirm Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id="confirm" type={showConfirm?'text':'password'} autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} className="pl-10 pr-10 h-12" required/><button type="button" aria-label="Show confirmation password" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirm?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
      <Button type="submit" className="w-full h-12" disabled={loading}>{loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating account...</>:'Create account'}</Button>
    </form>
  </AuthLayout>;
}
