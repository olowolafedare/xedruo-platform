import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ExternalLink } from "lucide-react";

const companies = [
  { slug: "pay-and-play", name: "Pay & Play", desc: "Digital wallet, payments, music, artist services & tickets", icon: "💳" },
  { slug: "sportruo", name: "Sportruo", desc: "Sports news, fixtures, results, talent & competitions", icon: "🏆" },
  { slug: "hireuo", name: "Hireuo", desc: "Hiring, vacancies, recruitment & workforce", icon: "👥" },
  { slug: "adom", name: "Adom", desc: "Advertising, marketplace & business services", icon: "🛒" },
  { slug: "healthruo", name: "Healthruo", desc: "Health services, providers & care", icon: "❤️" },
  { slug: "logistics", name: "Xedruo Logistics", desc: "Logistics, delivery & tracking", icon: "🚚" },
  { slug: "properties", name: "Xedruo Properties", desc: "Real estate, property listings & services", icon: "🏠" },
  { slug: "spacetruo", name: "Spacetruo", desc: "Space, offices, venues & bookings", icon: "🏢" },
  { slug: "xedruo-ai", name: "Xedruo AI", desc: "AI tools, app building & intelligent workflows", icon: "✨" },
  { slug: "distribution", name: "Xedruo Music Distribution", desc: "Independent music distribution platform — preserved as its own application", icon: "🎵", existing: true },
];

const SPORTRUO_URL = "https://sportruo-lcrv5o.v2.appdeploy.ai/";

export default function GroupLanding() {
  return (
    <div className="min-h-screen bg-[#070b1d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b1d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-cyan-300" /></div>
            <div><div className="font-bold tracking-tight">Xedruo</div><div className="text-[10px] tracking-[0.22em] text-slate-400 uppercase">Group Holdings</div></div>
          </Link>
          <div><Link to="/register" className="rounded-xl bg-cyan-300 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-cyan-200">Get started</Link></div>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden border-b border-white/10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.13),transparent_42%)]" /><div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center"><div className="mx-auto mb-7 w-20 h-20 rounded-3xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center"><Building2 className="w-10 h-10 text-cyan-300" /></div><div className="text-xs sm:text-sm font-semibold tracking-[0.38em] text-cyan-300 uppercase mb-5">Xedruo Group Holdings · Parent Company</div><h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[.95]">Powering <span className="text-cyan-300">10</span><br />companies.</h1><p className="mt-7 text-lg sm:text-xl leading-8 text-slate-400 max-w-3xl mx-auto">The parent company provides governance, strategy and shared infrastructure. Each operating company remains an independent business with its own platform.</p></div></section>
        <section id="companies" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20"><div className="flex items-end justify-between gap-4 mb-8"><div><div className="text-xs tracking-[0.3em] uppercase text-slate-500 mb-2">The Group</div><h2 className="text-3xl sm:text-4xl font-bold">Choose an independent company</h2></div><div className="text-slate-500 text-sm">10 total</div></div><div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-300/10 flex items-center justify-center text-2xl">🏢</div><div className="flex-1"><div className="text-xs text-cyan-300 font-semibold tracking-[0.18em] uppercase">01 · Parent company</div><h3 className="text-xl font-bold mt-1">Xedruo Group Holdings</h3><p className="text-sm text-slate-400 mt-1">Group governance, strategy, technology and shared infrastructure.</p></div><Link to="/management" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Management <ArrowRight className="w-4 h-4" /></Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{companies.map((company, index) => {const destination = company.existing ? "/distribution" : company.slug === "sportruo" ? SPORTRUO_URL : `/${company.slug}`; return <a key={company.slug} href={destination} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.07] hover:border-cyan-300/25 transition"><div className="flex items-center justify-between mb-5"><div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">{company.icon}</div><span className="text-xs text-slate-600 font-semibold">{String(index + 2).padStart(2, "0")}</span></div><h3 className="font-bold text-lg group-hover:text-cyan-300 transition">{company.name}</h3><p className="text-sm text-slate-400 mt-2 min-h-10 leading-5">{company.desc}</p><div className="mt-5 text-sm text-cyan-300 font-semibold inline-flex items-center gap-1">Open independent platform <ExternalLink className="w-3.5 h-3.5" /></div></a>;})}</div></section>
        <section className="border-t border-white/10 bg-white/[.02]"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 text-center"><h2 className="text-2xl sm:text-3xl font-bold">One parent company. 10 independent companies.</h2><p className="mt-3 text-slate-400">Each operating company has its own platform today.</p></div></section>
      </main>
    </div>
  );
}
