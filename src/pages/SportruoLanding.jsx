import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, ShieldCheck, Search, Trophy, Users, Building2, CalendarDays, Brain, Repeat2, MapPin, Ticket, UserRound, BriefcaseBusiness, Star, PlayCircle, ChevronRight } from "lucide-react";

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
const participantTools = ["Sports profile", "Registration", "Teams & clubs", "Competitions", "Talent opportunities", "Transfers", "Statistics", "AI performance"];
const fanTools = ["Explore sports", "Live events", "Tickets", "Subscriptions", "Follow teams", "Follow athletes", "Predictions", "My tickets"];

export default function SportruoLanding() {
  const [country, setCountry] = useState("");
  const [sport, setSport] = useState("");
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("fan");
  const [query, setQuery] = useState("");
  const accent = "#f97316";
  const filteredSports = useMemo(() => sports.filter(s => s.toLowerCase().includes(query.toLowerCase())), [query]);
  const isParticipant = mode === "participant";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/company/sportruo" className="font-black tracking-tight text-lg">SPORTRUO</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#experience">Experience</a><a href="#ecosystem">Ecosystem</a><a href="#sports">Sports</a><a href="#ai">AI & Predictions</a>
          </nav>
          <div className="flex items-center gap-2"><Link to="/login" className="px-3 py-2 rounded-lg text-sm font-semibold border border-border">Login</Link><Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{backgroundColor:accent}}>Unified Xedruo ID</Link></div>
        </div>
      </header>

      <main>
        <section id="experience" className="max-w-7xl mx-auto px-5 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold" style={{borderColor:`${accent}66`,color:accent,backgroundColor:`${accent}12`}}><Globe2 className="w-4 h-4"/> GLOBAL MULTI-SPORT ECOSYSTEM</div>
              <h1 className="mt-7 text-4xl sm:text-6xl font-black tracking-tight">Every sport. Every country. One sports ecosystem.</h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl">Sportruo connects people who participate in sport with people who simply want to experience it. One Unified Xedruo ID powers both journeys.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#onboarding" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Get started <ArrowRight className="w-4 h-4"/></a><Link to="/register" className="rounded-xl px-5 py-3 font-semibold border border-border">Create Unified Xedruo ID</Link></div>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="w-4 h-4"/> One identity across Sportruo and the wider Xedruo ecosystem</div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Choose your Sportruo experience</div>
              <div className="grid grid-cols-2 gap-2 mt-5 p-1 rounded-xl bg-muted">
                <button onClick={()=>setMode("fan")} className={`rounded-lg px-4 py-3 text-sm font-semibold ${mode==='fan'?'bg-background shadow-sm':''}`}><span className="inline-flex items-center gap-2"><Ticket className="w-4 h-4"/> Fan</span></button>
                <button onClick={()=>setMode("participant")} className={`rounded-lg px-4 py-3 text-sm font-semibold ${mode==='participant'?'bg-background shadow-sm':''}`}><span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4"/> Participant</span></button>
              </div>
              <div className="mt-5 rounded-2xl border border-border p-5">
                <h2 className="text-2xl font-bold">{isParticipant ? "Build your sports career" : "Experience live sport"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{isParticipant ? "Create a sports profile, register, find opportunities, manage teams and use AI tools." : "You do not need to know an athlete. Discover events, subscribe to Sportruo services or buy a ticket to experience sport."}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">{(isParticipant?participantTools:fanTools).map(t=><div key={t} className="rounded-xl bg-muted/60 px-3 py-2 text-xs font-medium">{t}</div>)}</div>
                {!isParticipant && <Link to="/pay-and-play" className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Buy tickets via Pay & Play <Ticket className="w-4 h-4"/></Link>}
              </div>
            </div>
          </div>
        </section>

        <section id="onboarding" className="border-y border-border bg-muted/20"><div className="max-w-7xl mx-auto px-5 py-16"><div className="grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-start"><div><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Global onboarding</div><h2 className="mt-2 text-3xl sm:text-4xl font-black">Country → Sport → Role</h2><p className="mt-4 text-muted-foreground">Explore first. When you are ready to register or access personalised services, continue with your Unified Xedruo ID.</p><div className="mt-6 space-y-3 text-sm">{["Choose your country", "Select one or more sports", "Choose Fan or Participant role", "Create or access Unified Xedruo ID", "Get the dashboard for your role"].map((x,i)=><div key={x} className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full grid place-items-center text-white text-xs font-bold" style={{backgroundColor:accent}}>{i+1}</span><span>{x}</span></div>)}</div></div>
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-2xl font-bold">Set up your sports context</h3><p className="mt-2 text-sm text-muted-foreground">This does not create a second sports ID. Your Unified Xedruo ID remains the identity layer.</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <label className="block text-sm font-medium">Country<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Search or enter country" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"/></label>
              <label className="block text-sm font-medium">Sport<select value={sport} onChange={e=>setSport(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="">Select a sport</option>{sports.map(s=><option key={s}>{s}</option>)}</select></label>
              <label className="block text-sm font-medium">Role<select value={role} onChange={e=>setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="">Select a role</option>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
            </div>
            <button onClick={()=>setStarted(true)} className="mt-5 w-full rounded-xl px-5 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Continue</button>
            {started && <div className="mt-4 rounded-xl border p-4 text-sm" style={{borderColor:`${accent}55`,backgroundColor:`${accent}0d`}}><strong>{role || "Fan"}</strong> · <strong>{sport || "All sports"}</strong> · <strong>{country || "Global"}</strong>. Next: create/access your Unified Xedruo ID.</div>}
          </div></div></div></section>

        <section className="max-w-7xl mx-auto px-5 py-16"><div className="grid md:grid-cols-2 gap-6"><div className="rounded-3xl border border-border bg-card p-7"><UserRound className="w-7 h-7" style={{color:accent}}/><h2 className="mt-4 text-2xl font-black">Participants</h2><p className="mt-2 text-muted-foreground">For athletes, coaches, scouts, agents, officials, clubs, teams, academies, leagues, federations, venues and organisers.</p><div className="mt-5 flex flex-wrap gap-2">{participantTools.map(t=><span key={t} className="rounded-full border border-border px-3 py-1.5 text-xs">{t}</span>)}</div></div><div className="rounded-3xl border border-border bg-card p-7"><Ticket className="w-7 h-7" style={{color:accent}}/><h2 className="mt-4 text-2xl font-black">Fans</h2><p className="mt-2 text-muted-foreground">For people who simply want to enjoy sport. Discover an event without needing to know the athlete, subscribe to Sportruo services, or buy a ticket.</p><div className="mt-5 flex flex-wrap gap-2">{fanTools.map(t=><span key={t} className="rounded-full border border-border px-3 py-1.5 text-xs">{t}</span>)}</div><Link to="/pay-and-play" className="mt-6 inline-flex items-center gap-2 font-semibold" style={{color:accent}}>Go to Pay & Play for tickets <ChevronRight className="w-4 h-4"/></Link></div></div></section>

        <section id="ecosystem" className="border-y border-border bg-muted/20"><div className="max-w-7xl mx-auto px-5 py-16"><div className="max-w-3xl"><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>The ecosystem</div><h2 className="mt-2 text-3xl sm:text-4xl font-black">From registration to competition and fan experience.</h2><p className="mt-4 text-muted-foreground">Sportruo uses a universal sports architecture while allowing each sport to keep its own rules, terminology and workflows.</p></div><div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{modules.map(([title,text,Icon])=><div key={title} className="rounded-2xl border border-border bg-card p-6"><Icon className="w-6 h-6" style={{color:accent}}/><h3 className="mt-5 font-bold text-lg">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>)}</div></div></section>

        <section id="sports" className="max-w-7xl mx-auto px-5 py-16"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5"><div><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Global sports</div><h2 className="mt-2 text-3xl font-black">Built for every sport</h2></div><div className="relative w-full md:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a sport" className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-3 outline-none"/></div></div><div className="mt-8 flex flex-wrap gap-2">{filteredSports.map(s=><button key={s} onClick={()=>setSport(s)} className={`rounded-full border px-4 py-2 text-sm font-medium ${sport===s?'border-transparent text-white':''}`} style={sport===s?{backgroundColor:accent}:undefined}>{s}</button>)}</div></section>

        <section id="ai" className="max-w-7xl mx-auto px-5 pb-16"><div className="rounded-3xl border p-8 sm:p-12" style={{borderColor:`${accent}55`,background:`linear-gradient(135deg, ${accent}18, transparent 70%)`}}><div className="max-w-4xl"><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>Sportruo AI</div><h2 className="mt-3 text-3xl sm:text-4xl font-black">Analyse performance. Discover talent. Forecast events.</h2><p className="mt-4 text-muted-foreground">Sport-specific analytics can support participants and fans with performance insights and probability-based forecasts. Forecasts are informational and are not guaranteed outcomes.</p><div className="mt-7 grid sm:grid-cols-3 gap-4"><div className="rounded-2xl border border-border bg-card/80 p-5"><Trophy className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Events</div><div className="text-sm text-muted-foreground mt-1">Matches, games, races, tournaments and competitions.</div></div><div className="rounded-2xl border border-border bg-card/80 p-5"><Users className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Talent</div><div className="text-sm text-muted-foreground mt-1">Global discovery, scouting and recruitment workflows.</div></div><div className="rounded-2xl border border-border bg-card/80 p-5"><Brain className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Predictions</div><div className="text-sm text-muted-foreground mt-1">AI probability and performance forecasts by sport.</div></div></div></div></div></section>

        <section className="max-w-7xl mx-auto px-5 pb-20"><div className="rounded-3xl border border-border bg-card p-8 sm:p-12"><div className="grid md:grid-cols-2 gap-8 items-center"><div><div className="text-sm font-semibold uppercase tracking-widest" style={{color:accent}}>One identity. Two journeys.</div><h2 className="mt-2 text-3xl font-black">Participate in sport or simply experience it.</h2><p className="mt-3 text-muted-foreground">Your Unified Xedruo ID connects your Sportruo identity. Participants get professional tools; fans get discovery, subscriptions and ticket access.</p></div><div className="grid sm:grid-cols-2 gap-3"><Link to="/register" className="rounded-2xl border border-border p-5 hover:bg-muted"><BriefcaseBusiness className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Join as Participant</div><div className="text-xs text-muted-foreground mt-1">Build your sports career or organisation.</div></Link><Link to="/pay-and-play" className="rounded-2xl border border-border p-5 hover:bg-muted"><Ticket className="w-5 h-5" style={{color:accent}}/><div className="mt-3 font-bold">Experience as Fan</div><div className="text-xs text-muted-foreground mt-1">Discover events, subscribe or buy tickets.</div></Link></div></div></div></section>
      </main>
      <footer className="border-t border-border"><div className="max-w-7xl mx-auto px-5 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-3"><span>© Xedruo Group Holdings · Sportruo</span><span className="inline-flex items-center gap-1"><PlayCircle className="w-4 h-4"/> Global sports ecosystem</span></div></footer>
    </div>
  );
}
