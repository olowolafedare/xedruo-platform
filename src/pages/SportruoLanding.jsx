import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, ShieldCheck, Search, Trophy, Users, Building2, CalendarDays, Brain, Repeat2, MapPin, ChevronDown } from "lucide-react";

const sports = ["Football", "Basketball", "Tennis", "Volleyball", "Cricket", "Rugby", "Baseball", "Boxing", "Athletics", "Swimming", "Cycling", "Motorsport", "Golf", "Table Tennis", "Badminton", "Gymnastics", "Archery", "Wrestling", "Weightlifting", "Skateboarding"];
const roles = ["Athlete / Player", "Coach", "Scout", "Agent / Representative", "Referee / Official", "Club / Team", "Academy", "League / Competition", "Federation / Association", "Venue / Stadium", "Event Organiser", "Fan"];
const modules = [
  ["Talent Acquisition", "Discover, evaluate, shortlist and connect with sports talent worldwide.", Search],
  ["Transfers & Registration", "Manage transfers, windows, trials and sport-specific registration workflows.", Repeat2],
  ["Clubs, Teams & Leagues", "Create and manage clubs, teams, academies, leagues and competitions.", Building2],
  ["Matches & Events", "Fixtures, games, races, tournaments, meets, results and live event experiences.", CalendarDays],
  ["Venues", "Register stadiums, arenas, courts, pools, circuits and other sports facilities.", MapPin],
  ["Sportruo AI", "Performance analysis, talent discovery and multi-sport AI forecasts and probabilities.", Brain],
];

export default function SportruoLanding() {
  const [country, setCountry] = useState("");
  const [sport, setSport] = useState("");
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const accent = "#f97316";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="font-black tracking-tight text-lg">SPORTRUO</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#ecosystem">Ecosystem</a><a href="#sports">Sports</a><a href="#ai">AI & Predictions</a>
          </nav>
          <div className="flex items-center gap-2"><Link to="/login" className="px-3 py-2 rounded-lg text-sm font-semibold border border-border">Login</Link><Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{backgroundColor:accent}}>Unified Xedruo ID</Link></div>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-5 py-16 sm:py-24">
          <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold" style={{borderColor:`${accent}66`,color:accent,backgroundColor:`${accent}12`}}><Globe2 className="w-4 h-4"/> GLOBAL MULTI-SPORT ECOSYSTEM</div>
              <h1 className="mt-7 text-4xl sm:text-6xl font-black tracking-tight">Every sport. Every country. One sports ecosystem.</h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl">Sportruo connects athletes, clubs, teams, academies, leagues, venues, scouts, coaches, agents, officials, events and fans through one global sports network powered by the Unified Xedruo ID.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#register" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Explore & register <ArrowRight className="w-4 h-4"/></a><Link to="/register" className="rounded-xl px-5 py-3 font-semibold border border-border">Create Unified Xedruo ID</Link></div>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="w-4 h-4"/> One Xedruo identity across the ecosystem</div>
            </div>
            <div id="register" className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Start your sports journey</div>
              <h2 className="mt-2 text-2xl font-bold">Choose your country, sport and role</h2>
              <p className="mt-2 text-sm text-muted-foreground">You can explore publicly before creating or accessing your Unified Xedruo ID.</p>
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium">Country<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Search or enter country" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"/></label>
                <label className="block text-sm font-medium">Sport<select value={sport} onChange={e=>setSport(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="">Select a sport</option>{sports.map(s=><option key={s}>{s}</option>)}</select></label>
                <label className="block text-sm font-medium">Role<select value={role} onChange={e=>setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="">Select your role</option>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
                <button onClick={()=>setStarted(true)} className="w-full rounded-xl px-5 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Continue</button>
                {started && <div className="rounded-xl border p-4 text-sm" style={{borderColor:`${accent}55`,backgroundColor:`${accent}0d`}}><strong>{sport || "Sports"}</strong> in <strong>{country || "your country"}</strong> · <strong>{role || "your role"}</strong>. Next step: create/access your Unified Xedruo ID.</div>}
              </div>
            </div>
          </div>
        </section>

        <section id="ecosystem" className="border-y border-border bg-muted/20"><div className="max-w-7xl mx-auto px-5 py-16"><div className="max-w-3xl"><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>The ecosystem</div><h2 className="mt-2 text-3xl sm:text-4xl font-black">From registration to competition and career opportunities.</h2><p className="mt-4 text-muted-foreground">Sportruo is designed around sport-specific rules and workflows while keeping the identity layer unified.</p></div><div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{modules.map(([title,text,Icon])=><div key={title} className="rounded-2xl border border-border bg-card p-6"><Icon className="w-6 h-6" style={{color:accent}}/><h3 className="mt-5 font-bold text-lg">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>)}</div></div></section>

        <section id="sports" className="max-w-7xl mx-auto px-5 py-16"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5"><div><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Global sports</div><h2 className="mt-2 text-3xl font-black">Built for every sport</h2></div><p className="max-w-xl text-sm text-muted-foreground">Select one sport or build multiple sports profiles under the same Unified Xedruo ID.</p></div><div className="mt-8 flex flex-wrap gap-2">{sports.map(s=><span key={s} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{s}</span>)}</div></section>

        <section id="ai" className="max-w-7xl mx-auto px-5 pb-16"><div className="rounded-3xl border p-8 sm:p-12" style={{borderColor:`${accent}55`,background:`linear-gradient(135deg, ${accent}18, transparent 70%)`}}><div className="max-w-3xl"><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Sportruo AI</div><h2 className="mt-3 text-3xl sm:text-4xl font-black">Analyse performance. Discover talent. Forecast events.</h2><p className="mt-4 text-muted-foreground">Sport-specific analytics can support athletes, clubs, scouts and fans with performance insights and probability-based forecasts. Forecasts are informational and are not guaranteed outcomes.</p><div className="mt-7 grid sm:grid-cols-3 gap-4"><div className="rounded-2xl border border-border bg-card/80 p-5"><Trophy className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Events</div><div className="text-sm text-muted-foreground mt-1">Matches, races, tournaments and competitions.</div></div><div className="rounded-2xl border border-border bg-card/80 p-5"><Users className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Talent</div><div className="text-sm text-muted-foreground mt-1">Global discovery, scouting and recruitment workflows.</div></div><div className="rounded-2xl border border-border bg-card/80 p-5"><Brain className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Predictions</div><div className="text-sm text-muted-foreground mt-1">AI probability and performance forecasts by sport.</div></div></div></div></div></section>

        <section className="max-w-7xl mx-auto px-5 pb-20"><div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center"><h2 className="text-3xl font-black">One identity. A world of sport.</h2><p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Create your Unified Xedruo ID and build the sports profiles, organisation connections and opportunities that fit you.</p><div className="mt-7"><Link to="/register" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Create Unified Xedruo ID <ArrowRight className="w-4 h-4"/></Link></div></div></section>
      </main>
      <footer className="border-t border-border"><div className="max-w-7xl mx-auto px-5 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-3"><span>© Xedruo Group Holdings · Sportruo</span><Link to="/" className="hover:text-foreground">Xedruo</Link></div></footer>
    </div>
  );
}
