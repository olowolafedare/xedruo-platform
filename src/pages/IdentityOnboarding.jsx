import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AuthLayout from '@/components/AuthLayout';
import { supabase, xedruo } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';
import { ensureXedruoId, markPhoneVerified } from '@/lib/xedruoIdentity';
import { COUNTRIES } from '@/data/countries';

const normalizePhone = (value) => value.trim().replace(/[()\s-]/g, '');

export default function IdentityOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('contact');
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) throw new Error('Your login session is not ready. Please sign in again.');
        const { data, error: readError } = await supabase.from('xedruo_customer_profiles').select('country_code,country_name,phone_e164,phone_verified').eq('user_id', user.id).maybeSingle();
        if (readError) throw readError;
        if (data?.country_code) setCountry(data.country_code);
        if (data?.phone_e164) setPhone(data.phone_e164);
        if (data?.phone_verified) {
          const current = await ensureXedruoId({ temporary: true });
          setIdentity(current);
          setStep('complete');
        }
      } catch (err) { setError(err.message || 'Could not load onboarding.'); }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : COUNTRIES;
  }, [countrySearch]);

  const selected = COUNTRIES.find(c => c.code === country);

  const sendPhoneCode = async () => {
    setError('');
    if (!country) return setError('Select your country');
    const value = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(value)) return setError('Enter your phone number in international format, e.g. +2348012345678');
    if (!user?.id) return setError('Your login session is not ready. Please sign in again.');
    setSending(true);
    try {
      const { error: upsertError } = await supabase.from('xedruo_customer_profiles').upsert({ user_id: user.id, country_code: country, country_name: selected?.name || null, phone_e164: value, phone_verified: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;
      await xedruo.auth.sendPhoneOtp(value);
      setPhone(value); setStep('otp');
    } catch (err) { setError(err.message || 'Could not send phone verification code.'); }
    finally { setSending(false); }
  };

  const verifyPhone = async () => {
    setError('');
    if (otp.length !== 6) return setError('Enter the 6-digit verification code');
    setSending(true);
    try {
      await xedruo.auth.verifyPhoneOtp(phone, otp);
      const result = await markPhoneVerified({ countryCode: country, countryName: selected?.name, phoneE164: phone });
      setIdentity(result || await ensureXedruoId({ temporary: true }));
      setStep('complete');
    } catch (err) { setError(err.message || 'Invalid or expired phone verification code.'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (step === 'complete' && identity) return <AuthLayout icon={ShieldCheck} title="Your Xedruo account is ready" subtitle="Your temporary identity is active for 30 days while you complete verification.">
    <div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
      <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-primary" /><div><p className="font-semibold">Temporary Xedruo ID</p><p className="text-2xl font-bold tracking-widest">{identity.xedruo_id}</p></div></div>
      <div className="flex items-center gap-2 text-sm"><Clock3 className="w-4 h-4" /> Valid for 30 days from issuance.</div>
      <p className="text-sm text-muted-foreground">Complete the regional KYC requirements before the deadline to keep your account and convert this ID to permanent verified status.</p>
    </div>
    <Button className="w-full h-12 mt-5" onClick={() => navigate('/dashboard', { replace: true })}>Continue to Xedruo</Button>
  </AuthLayout>;

  if (step === 'otp') return <AuthLayout icon={Phone} title="Verify your phone" subtitle={`We sent a 6-digit code to ${phone}`}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <div className="flex justify-center mb-6"><InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus><InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
    <Button className="w-full h-12" onClick={verifyPhone} disabled={sending || otp.length !== 6}>{sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify phone & get temporary ID'}</Button>
    <button className="w-full mt-4 text-sm text-primary font-medium" onClick={() => setStep('contact')}>Change phone number</button>
  </AuthLayout>;

  return <AuthLayout icon={ShieldCheck} title="Complete your Xedruo account" subtitle="Choose your country and verify your phone. You will receive a temporary 30-day Xedruo ID; KYC is completed later based on your region.">
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <div className="space-y-4">
      <div className="space-y-2"><Label>Country</Label><Input placeholder="Search country..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} />
        <select aria-label="Select country" className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm" value={country} onChange={e => setCountry(e.target.value)} size={Math.min(7, Math.max(3, filteredCountries.length))}>
          <option value="">Select country</option>{filteredCountries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor="onboarding-phone">Phone number</Label><Input id="onboarding-phone" type="tel" autoComplete="tel" placeholder="+2348012345678" value={phone} onChange={e => setPhone(e.target.value)} /></div>
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">🔐 Your country determines the KYC requirements shown later. We will not ask every region for the same documents.</div>
      <Button className="w-full h-12" onClick={sendPhoneCode} disabled={sending}>{sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending code...</> : 'Send phone verification code'}</Button>
    </div>
  </AuthLayout>;
}
