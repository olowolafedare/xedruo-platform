import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Baby, CalendarDays, CheckCircle2, ChevronDown, CircleUserRound, Clock3, HeartPulse, Hospital, MapPin, Search, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';

const countries = ['Nigeria','Ghana','Kenya','South Africa','United Kingdom','United States','Canada','Australia','Germany','France','India','United Arab Emirates'];
const services = [
  ['Find care','Search hospitals, clinics, pharmacies, laboratories and specialists.',Hospital],
  ['Online consultation','Request virtual care and manage follow-up appointments.',Stethoscope],
  ['Appointments','Book in-person or virtual visits and keep your schedule in one place.',CalendarDays],
  ['Women’s health','Cycle, symptom, ovulation and fertility tracking with private controls.',HeartPulse],
  ['Pregnancy journey','Track milestones, prenatal appointments and care notes.',Baby],
  ['Health records','Organize medications, measurements, treatment history and documents.',Activity],
];
const facilities = [
  { name:'General Care Centre', type:'Clinic', city:'Lagos', country:'Nigeria', service:'Primary care' },
  { name:'Family & Women’s Health', type:'Specialist clinic', city:'Abuja', country:'Nigeria', service:'Women’s health' },
  { name:'Healthruo Telecare', type:'Virtual care', city:'Global', country:'Worldwide', service:'Online consultation' },
];

function ActionCard({ icon:Icon, title, text, onClick }) { return <button onClick={onClick} className="text-left rounded-2xl border border-border bg-card p-5 hover:border-cyan-500/60 transition w-full"><Icon className="w-6 h-6 text-cyan-600"/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-600">Open <ArrowRight className="w-4 h-4"/></span></button> }

export default function HealthruoLanding() {
  const [country, setCountry] = useState('Nigeria');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('care');
  const [booked, setBooked] = useState(false);
  const filtered = useMemo(() => facilities.filter(f => (country === 'Worldwide' || f.country === country || f.country === 'Worldwide') && `${f.name} ${f.type} ${f.service}`.toLowerCase().includes(query.toLowerCase())), [country, query]);

  const jump = (tab) => { setActive(tab); window.setTimeout(() => document.getElementById('health-workspace')?.scrollIntoView({ behavior:'smooth', block:'start' }), 0); };

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 font-black tracking-tight text-xl"><span className="grid place-items-center w-9 h-9 rounded-xl bg-cyan-600 text-white"><HeartPulse className="w-5 h-5"/></span>Healthruo</Link>
        <div className="hidden md:flex items-center gap-5 text-sm font-semibold"><button onClick={()=>jump('care')}>Find care</button><button onClick={()=>jump('tracking')}>Track health</button><button onClick={()=>jump('providers')}>For providers</button></div>
        <div className="flex items-center gap-2"><Link to="/login" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Sign in</Link><Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600">Get started</Link></div>
      </div>
    </header>

    <main>
      <section className="max-w-7xl mx-auto px-5 py-14 sm:py-20">
        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-600"><ShieldCheck className="w-4 h-4"/> Connected healthcare ecosystem</div>
            <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight">Healthcare that follows your journey.</h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">Find care, book appointments, connect with professionals and privately track your health journey with one Healthruo account.</p>
            <div className="mt-7 flex flex-wrap gap-3"><button onClick={()=>jump('care')} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white bg-cyan-600">Find healthcare <ArrowRight className="w-4 h-4"/></button><button onClick={()=>jump('tracking')} className="rounded-xl px-5 py-3 font-semibold border border-border">Start tracking</button></div>
            <p className="mt-4 text-xs text-muted-foreground">Healthruo supports care coordination and health tracking; it does not replace emergency services or a qualified clinician.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3"><CircleUserRound className="w-9 h-9 text-cyan-600"/><div><p className="font-bold">Healthruo ID</p><p className="text-sm text-muted-foreground">One identity across your care journey</p></div></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Appointments</p><p className="mt-1 text-2xl font-black">3</p></div><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Care providers</p><p className="mt-1 text-2xl font-black">8</p></div></div>
            <div className="mt-3 rounded-xl bg-cyan-500/10 p-4 text-sm"><span className="font-semibold">Privacy controls</span><p className="mt-1 text-muted-foreground">Share records only with authorized care relationships and consent.</p></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-16"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{services.map(([title,text,Icon])=><ActionCard key={title} icon={Icon} title={title} text={text} onClick={()=>jump(title==='Find care'||title==='Appointments'?'care':title==='Health records'?'tracking':'tracking')}/>)}</div></section>

      <section id="health-workspace" className="max-w-7xl mx-auto px-5 pb-20 scroll-mt-24">
        <div className="rounded-3xl border border-border overflow-hidden">
          <div className="border-b border-border p-5 flex flex-wrap gap-2"><button onClick={()=>setActive('care')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${active==='care'?'bg-cyan-600 text-white':'border border-border'}`}>Find care</button><button onClick={()=>setActive('tracking')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${active==='tracking'?'bg-cyan-600 text-white':'border border-border'}`}>Health tracking</button><button onClick={()=>setActive('providers')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${active==='providers'?'bg-cyan-600 text-white':'border border-border'}`}>Provider onboarding</button></div>
          {active==='care' && <div className="p-6 sm:p-8"><div className="flex flex-col lg:flex-row gap-3"><label className="relative flex-1"><Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search care, facility or specialist" className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/30"/></label><label className="relative lg:w-64"><MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground"/><select value={country} onChange={e=>setCountry(e.target.value)} className="w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-10 py-3"><option>Worldwide</option>{countries.map(c=><option key={c}>{c}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 w-5 h-5 text-muted-foreground"/></label></div><div className="mt-6 grid md:grid-cols-3 gap-4">{filtered.map(f=><div key={f.name} className="rounded-2xl border border-border p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{f.name}</p><p className="text-sm text-muted-foreground">{f.type} · {f.service}</p></div><CheckCircle2 className="w-5 h-5 text-cyan-600"/></div><p className="mt-4 text-sm flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4"/>{f.city}, {f.country}</p><button onClick={()=>setBooked(true)} className="mt-5 w-full rounded-lg bg-cyan-600 text-white py-2.5 text-sm font-semibold">Book / request care</button></div>)}{!filtered.length&&<div className="md:col-span-3 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No matching facilities yet. Providers can register to become discoverable.</div>}</div>{booked&&<div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-600"/> Care request started. Sign in to complete booking and secure your appointment.</div>}</div>}
          {active==='tracking' && <div className="p-6 sm:p-8"><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="rounded-2xl border border-border p-5"><HeartPulse className="w-6 h-6 text-cyan-600"/><p className="mt-4 font-bold">Cycle & ovulation</p><p className="mt-1 text-sm text-muted-foreground">Record cycle dates, symptoms and estimated fertile windows.</p></div><div className="rounded-2xl border border-border p-5"><Baby className="w-6 h-6 text-cyan-600"/><p className="mt-4 font-bold">Pregnancy</p><p className="mt-1 text-sm text-muted-foreground">Track milestones, visits and prenatal notes.</p></div><div className="rounded-2xl border border-border p-5"><Activity className="w-6 h-6 text-cyan-600"/><p className="mt-4 font-bold">Vitals & medication</p><p className="mt-1 text-sm text-muted-foreground">Keep personal logs for discussion with your care team.</p></div><div className="rounded-2xl border border-border p-5"><Clock3 className="w-6 h-6 text-cyan-600"/><p className="mt-4 font-bold">Care timeline</p><p className="mt-1 text-sm text-muted-foreground">Appointments, follow-ups and treatment records in one view.</p></div></div><div className="mt-6 rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="font-bold">Private health workspace</p><p className="text-sm text-muted-foreground">Tracking is informational and should be reviewed with a qualified professional when needed.</p></div><Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-white text-sm font-semibold">Create workspace <ArrowRight className="w-4 h-4"/></Link></div></div>}
          {active==='providers' && <div className="p-6 sm:p-8"><div className="max-w-3xl"><div className="flex items-center gap-3"><UserRound className="w-8 h-8 text-cyan-600"/><div><h2 className="text-2xl font-bold">Join Healthruo as a provider</h2><p className="text-muted-foreground">Facilities and professionals can register, complete verification, publish services and manage appointment requests.</p></div></div><div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-border p-4">1. Create provider profile</div><div className="rounded-xl border border-border p-4">2. Submit credentials & facility details</div><div className="rounded-xl border border-border p-4">3. Verification review</div><div className="rounded-xl border border-border p-4">4. Publish services & availability</div></div><Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-white font-semibold">Register provider <ArrowRight className="w-4 h-4"/></Link></div></div>}
        </div>
      </section>
    </main>
    <footer className="border-t border-border"><div className="max-w-7xl mx-auto px-5 py-8 flex flex-col sm:flex-row justify-between gap-3 text-sm text-muted-foreground"><span>© Xedruo Group Holdings · Healthruo</span><span>Health information is private and access should be consent-based.</span></div></footer>
  </div>;
}
