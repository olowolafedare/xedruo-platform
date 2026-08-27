import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, HeartPulse, Hospital, Baby, Activity, ShieldCheck, Stethoscope } from 'lucide-react';

const modules = [
  ['Find care', 'Hospitals, clinics, pharmacies, laboratories and specialists.', Hospital],
  ['Online care', 'Connect with healthcare professionals and manage follow-ups.', Stethoscope],
  ['Appointments', 'Book and organize in-person or virtual care.', CalendarDays],
  ['Women’s health', 'Track cycles, symptoms, ovulation estimates and fertility.', HeartPulse],
  ['Pregnancy', 'Follow pregnancy milestones, appointments and prenatal records.', Baby],
  ['Health tracking', 'Keep personal measurements, medications and treatment history.', Activity],
];

export default function HealthruoLanding() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-black tracking-tight text-xl">Healthruo</Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600">Get started</Link>
        </div>
      </div>
    </header>

    <main>
      <section className="max-w-7xl mx-auto px-5 py-16 sm:py-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-600"><HeartPulse className="w-4 h-4"/> HEALTHCARE ECOSYSTEM</div>
          <h1 className="mt-7 text-4xl sm:text-6xl font-black tracking-tight">Your health. Your care. Connected.</h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl">Find healthcare, manage appointments, connect with professionals and keep track of your health journey from one Healthruo account.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white bg-cyan-600">Create Healthruo account <ArrowRight className="w-4 h-4"/></Link>
            <Link to="/login" className="rounded-xl px-5 py-3 font-semibold border border-border">Sign in</Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(([title, text, Icon]) => <article key={title} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="w-7 h-7 text-cyan-600"/>
            <h2 className="mt-5 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </article>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-20">
        <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-600"><ShieldCheck className="w-5 h-5"/> PRIVATE BY DESIGN</div>
            <h2 className="mt-4 text-3xl font-bold">You control your health information.</h2>
            <p className="mt-3 text-muted-foreground">Health information sharing should require appropriate consent and access controls. Healthruo is designed to support care, not replace qualified medical professionals or emergency services.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-20">
        <div className="rounded-3xl border border-border p-8 sm:p-12">
          <h2 className="text-3xl font-bold">Built for patients and care providers</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">Patients can manage their health journey while facilities and professionals can organize services, availability and appointments.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 font-semibold text-cyan-600">Join Healthruo <ArrowRight className="w-4 h-4"/></Link>
          </div>
        </div>
      </section>
    </main>
    <footer className="border-t border-border"><div className="max-w-7xl mx-auto px-5 py-8 text-sm text-muted-foreground">© Xedruo Group Holdings · Healthruo</div></footer>
  </div>;
}
