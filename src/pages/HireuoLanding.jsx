import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Building2, Globe2, Search, Sparkles, FileText, Users, ShieldCheck, CreditCard, UserRound, CheckCircle2 } from "lucide-react";

const categories = ["Technology", "Healthcare", "Finance", "Engineering", "Education", "Marketing", "Sales", "Construction", "Logistics", "Hospitality", "Creative", "Legal"];
const workTypes = ["Full-time", "Part-time", "Contract", "Temporary", "Freelance", "Internship", "Apprenticeship"];
const countries = ["Worldwide", "Nigeria", "United Kingdom", "United States", "Canada", "Germany", "United Arab Emirates", "South Africa", "Ghana", "Kenya", "India", "Australia"];

export default function HireuoLanding() {
  const [mode, setMode] = useState("jobseeker");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Worldwide");
  const [showAi, setShowAi] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const matches = useMemo(() => categories.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [query]);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/hireuo" className="font-black tracking-tight text-xl">HIREUO</Link>
        <nav className="hidden md:flex gap-6 text-sm text-muted-foreground"><a href="#jobs">Find Jobs</a><a href="#ai">Hireuo AI</a><a href="#employers">For Employers</a><a href="#global">Global</a></nav>
        <div className="flex gap-2"><Link to="/login" className="px-3 py-2 rounded-lg border border-border text-sm font-semibold">Login</Link><Link to="/register" className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold">Unified Xedruo ID</Link></div>
      </div>
    </header>

    <main>
      <section className="max-w-7xl mx-auto px-5 py-16 sm:py-24">
        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Globe2 className="w-4 h-4"/> Worldwide employment network</div>
            <h1 className="mt-7 text-4xl sm:text-6xl font-black tracking-tight">Find work. Find talent. Go further.</h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">Hireuo connects job seekers and employers across local and international opportunities, with AI tools for CV improvement, job matching and recruitment workflows.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#jobs" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-foreground text-background font-semibold">Explore jobs <ArrowRight className="w-4 h-4"/></a><button onClick={()=>setShowAi(true)} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold"><Sparkles className="w-4 h-4"/> Revamp my CV</button></div>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="w-4 h-4"/> One identity through Unified Xedruo ID</div>
          </div>

          <div id="jobs" className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex gap-2 p-1 rounded-xl bg-muted/50"><button onClick={()=>setMode("jobseeker")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode==="jobseeker"?"bg-background shadow-sm":"text-muted-foreground"}`}>I need a job</button><button onClick={()=>setMode("employer")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode==="employer"?"bg-background shadow-sm":"text-muted-foreground"}`}>I am hiring</button></div>
            {mode === "jobseeker" ? <>
              <h2 className="mt-6 text-2xl font-bold">Find your next opportunity</h2>
              <div className="mt-5 space-y-3"><label className="block text-sm font-medium">Job, skill or industry<div className="relative mt-2"><Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Software Engineer" className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 outline-none"/></div></label><label className="block text-sm font-medium">Location<select value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3">{countries.map(c=><option key={c}>{c}</option>)}</select></label></div>
              {query && <div className="mt-4 rounded-xl border border-border p-3 text-sm">Suggested categories: {matches.length ? matches.join(" · ") : "Search across all Hireuo jobs"}</div>}
              <button className="mt-5 w-full rounded-xl bg-foreground text-background px-5 py-3 font-semibold">Search Hireuo jobs</button>
            </> : <>
              <h2 className="mt-6 text-2xl font-bold">Find the right people</h2><p className="mt-2 text-sm text-muted-foreground">Post locally or internationally and manage your hiring pipeline from one employer workspace.</p><div className="mt-5 space-y-3"><input placeholder="Job title" className="w-full rounded-xl border border-border bg-background px-4 py-3"/><input placeholder="Company name" className="w-full rounded-xl border border-border bg-background px-4 py-3"/><select className="w-full rounded-xl border border-border bg-background px-4 py-3"><option>Worldwide / choose location</option>{countries.slice(1).map(c=><option key={c}>{c}</option>)}</select></div><button className="mt-5 w-full rounded-xl bg-foreground text-background px-5 py-3 font-semibold">Create a job</button></>}
          </div>
        </div>
      </section>

      <section id="ai" className="border-y border-border bg-muted/20"><div className="max-w-7xl mx-auto px-5 py-16"><div className="max-w-3xl"><div className="text-sm font-bold uppercase tracking-widest">Hireuo AI</div><h2 className="mt-2 text-3xl sm:text-4xl font-black">Turn your existing CV into a stronger application.</h2><p className="mt-4 text-muted-foreground">Upload your CV, review AI suggestions, and approve every change. Hireuo AI improves clarity, structure and job relevance without inventing qualifications, employers or experience.</p></div><div className="mt-8 grid md:grid-cols-3 gap-5"><div className="rounded-2xl border border-border bg-card p-6"><FileText className="w-6 h-6"/><h3 className="mt-4 font-bold">CV Revamp</h3><p className="mt-2 text-sm text-muted-foreground">Improve structure, wording, achievements and ATS readability.</p><button onClick={()=>setShowAi(true)} className="mt-5 text-sm font-semibold underline">Start CV review</button></div><div className="rounded-2xl border border-border bg-card p-6"><Search className="w-6 h-6"/><h3 className="mt-4 font-bold">Job Matching</h3><p className="mt-2 text-sm text-muted-foreground">Compare skills and experience against job requirements with explainable insights.</p></div><div className="rounded-2xl border border-border bg-card p-6"><Sparkles className="w-6 h-6"/><h3 className="mt-4 font-bold">Career Assistant</h3><p className="mt-2 text-sm text-muted-foreground">Prepare applications, interview practice and career development plans.</p></div></div></div></section>

      <section id="employers" className="max-w-7xl mx-auto px-5 py-16"><div className="grid lg:grid-cols-2 gap-8"><div className="rounded-3xl border border-border p-8"><Building2 className="w-7 h-7"/><h2 className="mt-5 text-3xl font-black">Employer workspace</h2><p className="mt-3 text-muted-foreground">Post jobs, receive applications, organize candidates, shortlist, schedule interviews and manage hiring decisions.</p><div className="mt-7 grid grid-cols-2 gap-3">{["Jobs", "Applications", "Candidates", "Interviews"].map(x=><div key={x} className="rounded-xl border border-border p-4 font-semibold">{x}</div>)}</div></div><div className="rounded-3xl border border-border p-8"><Users className="w-7 h-7"/><h2 className="mt-5 text-3xl font-black">Candidate journey</h2><div className="mt-6 space-y-3">{["Build career profile", "Revamp CV with AI", "Discover local or international jobs", "Apply and track status", "Interview and receive outcome"].map((x,i)=><div key={x} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 shrink-0"/><span className="text-sm">{i+1}. {x}</span></div>)}</div></div></div></section>

      <section id="global" className="max-w-7xl mx-auto px-5 pb-16"><div className="rounded-3xl border border-border p-8 sm:p-12"><div className="flex items-center gap-3"><Globe2 className="w-6 h-6"/><span className="font-bold">Global by design</span></div><h2 className="mt-3 text-3xl font-black">Local and international opportunities in one place.</h2><p className="mt-3 max-w-3xl text-muted-foreground">Hireuo supports worldwide discovery while respecting employer requirements, work authorization, visa rules and applicable employment laws. International visibility does not mean bypassing legal eligibility.</p><div className="mt-7 flex flex-wrap gap-2">{countries.map(c=><span key={c} className="rounded-full border border-border px-3 py-2 text-sm">{c}</span>)}</div></div></section>

      <section className="max-w-7xl mx-auto px-5 pb-20"><div className="rounded-3xl border border-border bg-card p-8 sm:p-12"><h2 className="text-3xl font-black">Hireuo services & billing</h2><p className="mt-3 max-w-3xl text-muted-foreground">Hireuo owns employment services, subscriptions and employer tools. Billing can be connected to approved Xedruo payment infrastructure while Hireuo remains the system of record for employment services.</p><div className="mt-6 grid sm:grid-cols-3 gap-4"><div className="rounded-xl border border-border p-4"><CreditCard className="w-5 h-5"/><div className="mt-3 font-bold">Hireuo subscription</div><div className="text-sm text-muted-foreground mt-1">Career and recruitment plans.</div></div><div className="rounded-xl border border-border p-4"><BriefcaseBusiness className="w-5 h-5"/><div className="mt-3 font-bold">Paid job services</div><div className="text-sm text-muted-foreground mt-1">Listings and employer tools.</div></div><div className="rounded-xl border border-border p-4"><UserRound className="w-5 h-5"/><div className="mt-3 font-bold">Unified identity</div><div className="text-sm text-muted-foreground mt-1">One Xedruo ID across services.</div></div></div></div></section>
    </main>

    {showAi && <div className="fixed inset-0 z-50 bg-black/50 p-5 flex items-center justify-center" onClick={()=>setShowAi(false)}><div className="w-full max-w-lg rounded-3xl border border-border bg-background p-7" onClick={e=>e.stopPropagation()}><div className="flex items-center gap-3"><Sparkles className="w-6 h-6"/><h2 className="text-2xl font-black">Hireuo AI CV Revamp</h2></div><p className="mt-3 text-sm text-muted-foreground">Choose your existing CV. The production flow will analyze it, show proposed changes and require your approval before creating a revised version.</p><div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center"><FileText className="w-8 h-8 mx-auto"/><p className="mt-3 font-semibold">Upload CV / Resume</p><p className="mt-1 text-xs text-muted-foreground">PDF, DOCX or TXT</p><button onClick={()=>setCvReady(true)} className="mt-5 rounded-xl bg-foreground text-background px-5 py-3 font-semibold">Select CV</button></div>{cvReady && <div className="mt-4 rounded-xl border border-border p-4 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> CV selected — ready for AI review.</div>}<div className="mt-6 flex justify-end gap-2"><button onClick={()=>setShowAi(false)} className="px-4 py-2 rounded-xl border border-border">Close</button><Link to="/register" className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold">Continue with Unified Xedruo ID</Link></div></div></div>}

    <footer className="border-t border-border"><div className="max-w-7xl mx-auto px-5 py-8 flex justify-between gap-4 text-sm text-muted-foreground"><span>© Xedruo · Hireuo</span><span>Worldwide employment network</span></div></footer>
  </div>;
}
