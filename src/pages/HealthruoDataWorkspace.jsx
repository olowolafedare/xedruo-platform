import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Baby, CalendarDays, CheckCircle2, HeartPulse, Hospital, Loader2, MapPin, RefreshCw, ShieldCheck, Stethoscope } from 'lucide-react';
import { supabase } from '@/api/xedruoClient';

const countries = ['Worldwide','Nigeria','Ghana','Kenya','South Africa','United Kingdom','United States','Canada','Australia','Germany','France','India','United Arab Emirates'];
const services = [
  ['Appointments','Book and manage in-person or virtual care.',CalendarDays],
  ['Health records','Your private clinical record timeline.',Activity],
  ['Women’s health','Cycle, ovulation and fertility tracking.',HeartPulse],
  ['Pregnancy','Pregnancy dates, milestones and care notes.',Baby],
  ['Medication','Active medications and instructions.',ShieldCheck],
  ['Find care','Verified facilities and professionals.',Hospital],
];

export default function HealthruoDataWorkspace() {
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState('Worldwide');
  const [facilities, setFacilities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [medications, setMedications] = useState([]);
  const [pregnancies, setPregnancies] = useState([]);
  const [records, setRecords] = useState([]);
  const [active, setActive] = useState('care');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);
      const [facilityRes, appointmentRes, trackingRes, medicationRes, pregnancyRes, recordRes] = await Promise.all([
        supabase.from('healthruo_facilities').select('id,name,facility_type,country_code,region,city,address,services,verification_status').eq('verification_status','verified').order('name').limit(100),
        currentUser ? supabase.from('healthruo_appointments').select('id,appointment_type,starts_at,ends_at,status,reason,facility_id,professional_id').eq('patient_user_id',currentUser.id).order('starts_at',{ascending:true}).limit(20) : Promise.resolve({data:[],error:null}),
        currentUser ? supabase.from('healthruo_tracking_entries').select('id,tracker_type,entry_date,values,notes').eq('user_id',currentUser.id).order('entry_date',{ascending:false}).limit(50) : Promise.resolve({data:[],error:null}),
        currentUser ? supabase.from('healthruo_medications').select('id,name,dosage,frequency,started_on,ends_on,active,instructions').eq('user_id',currentUser.id).order('active',{ascending:false}).limit(50) : Promise.resolve({data:[],error:null}),
        currentUser ? supabase.from('healthruo_pregnancies').select('id,start_date,due_date,status,notes').eq('user_id',currentUser.id).order('start_date',{ascending:false}).limit(10) : Promise.resolve({data:[],error:null}),
        currentUser ? supabase.from('healthruo_records').select('id,record_type,title,provider_name,facility_id,recorded_at,metadata').eq('patient_user_id',currentUser.id).order('recorded_at',{ascending:false}).limit(50) : Promise.resolve({data:[],error:null}),
      ]);
      const firstError = [facilityRes,appointmentRes,trackingRes,medicationRes,pregnancyRes,recordRes].find(r=>r?.error)?.error;
      if (firstError) throw firstError;
      setFacilities(facilityRes.data || []); setAppointments(appointmentRes.data || []); setTracking(trackingRes.data || []); setMedications(medicationRes.data || []); setPregnancies(pregnancyRes.data || []); setRecords(recordRes.data || []);
    } catch (e) { setError(e?.message || 'Unable to load Healthruo data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const { data: listener } = supabase.auth.onAuthStateChange(() => load()); return () => listener.subscription.unsubscribe(); }, []);

  const filteredFacilities = useMemo(() => facilities.filter(f => country === 'Worldwide' || f.country_code === country || f.country_code === country.slice(0,2).toUpperCase()), [facilities,country]);
  const latestTracking = tracking.slice(0,8);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl"><div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between"><Link to="/healthruo" className="font-black text-xl flex items-center gap-2"><span className="grid place-items-center w-9 h-9 rounded-xl bg-cyan-600 text-white"><HeartPulse className="w-5 h-5"/></span>Healthruo</Link><div className="flex items-center gap-2"><button onClick={load} className="p-2 rounded-lg border border-border" aria-label="Refresh"><RefreshCw className="w-4 h-4"/></button>{user ? <span className="text-sm text-muted-foreground hidden sm:block">Connected to your Xedruo ID</span> : <Link to="/login" className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold">Sign in</Link>}</div></div></header>
    <main className="max-w-7xl mx-auto px-5 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600"><ShieldCheck className="w-4 h-4"/> LIVE HEALTH WORKSPACE</div><h1 className="mt-3 text-4xl font-black tracking-tight">Your Healthruo dashboard</h1><p className="mt-2 text-muted-foreground">Live data from your Healthruo Supabase workspace.</p></div><label className="relative lg:w-64"><MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground"/><select value={country} onChange={e=>setCountry(e.target.value)} className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3">{countries.map(c=><option key={c}>{c}</option>)}</select></label></div>
      {error && <div className="mt-6 rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-sm">{error}</div>}
      {loading ? <div className="py-24 flex items-center justify-center gap-3 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/> Loading your Healthruo data…</div> : <>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{[['Appointments',appointments.length],['Records',records.length],['Tracking',tracking.length],['Medications',medications.length],['Pregnancies',pregnancies.length],['Facilities',facilities.length]].map(([label,count])=><div key={label} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{count}</p></div>)}</div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{services.map(([title,text,Icon],i)=><button key={title} onClick={()=>setActive(i===5?'care':i===0?'appointments':'health')} className="text-left rounded-2xl border border-border bg-card p-5 hover:border-cyan-500/50"><Icon className="w-6 h-6 text-cyan-600"/><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p></button>)}</div>
        {active==='care' && <section className="mt-8"><h2 className="text-2xl font-bold">Verified care facilities</h2><div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredFacilities.map(f=><article key={f.id} className="rounded-2xl border border-border p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{f.name}</h3><p className="text-sm text-muted-foreground">{f.facility_type}</p></div><CheckCircle2 className="w-5 h-5 text-cyan-600"/></div><p className="mt-3 text-sm text-muted-foreground">{[f.city,f.region,f.country_code].filter(Boolean).join(', ')}</p>{f.services?.length>0&&<p className="mt-2 text-xs text-muted-foreground">{f.services.slice(0,4).join(' · ')}</p>}<Link to="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-600">Request care <ArrowRight className="w-4 h-4"/></Link></article>)}{!filteredFacilities.length&&<div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No verified facilities match this country yet.</div>}</div></section>}
        {active==='appointments' && <section className="mt-8"><h2 className="text-2xl font-bold">My appointments</h2><div className="mt-4 space-y-3">{appointments.map(a=><div key={a.id} className="rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-semibold">{a.appointment_type || 'Care appointment'}</p><p className="text-sm text-muted-foreground">{a.starts_at ? new Date(a.starts_at).toLocaleString() : 'Time pending'} · {a.status || 'pending'}</p>{a.reason&&<p className="mt-1 text-sm text-muted-foreground">{a.reason}</p>}</div><CalendarDays className="w-5 h-5 text-cyan-600"/></div>)}{!appointments.length&&<div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No appointments yet. Sign in to request care.</div>}</div></section>}
        {active==='health' && <section className="mt-8 grid lg:grid-cols-2 gap-5"><div className="rounded-2xl border border-border p-5"><h2 className="text-xl font-bold">Recent health tracking</h2><div className="mt-4 space-y-3">{latestTracking.map(t=><div key={t.id} className="rounded-xl bg-muted/40 p-4"><div className="flex justify-between"><span className="font-semibold">{t.tracker_type}</span><span className="text-sm text-muted-foreground">{t.entry_date}</span></div>{t.notes&&<p className="mt-1 text-sm text-muted-foreground">{t.notes}</p>}</div>)}{!latestTracking.length&&<p className="text-sm text-muted-foreground">No tracking entries yet.</p>}</div></div><div className="rounded-2xl border border-border p-5"><h2 className="text-xl font-bold">Medications & pregnancy</h2><div className="mt-4 space-y-3">{medications.slice(0,5).map(m=><div key={m.id} className="rounded-xl bg-muted/40 p-4"><p className="font-semibold">{m.name}</p><p className="text-sm text-muted-foreground">{m.dosage || ''} {m.frequency || ''}</p></div>)}{pregnancies.slice(0,3).map(p=><div key={p.id} className="rounded-xl bg-muted/40 p-4"><p className="font-semibold flex items-center gap-2"><Baby className="w-4 h-4 text-cyan-600"/> Pregnancy</p><p className="text-sm text-muted-foreground">Due {p.due_date || 'date pending'} · {p.status || 'active'}</p></div>)}{!medications.length&&!pregnancies.length&&<p className="text-sm text-muted-foreground">No medication or pregnancy records yet.</p>}</div></div></section>}
        <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 text-sm text-muted-foreground">Healthruo data is private and access is governed by authentication and consent controls. Tracking features are informational and do not replace qualified medical care or emergency services.</div>
      </>}
    </main>
  </div>;
}
