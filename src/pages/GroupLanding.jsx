import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";

export default function GroupLanding() {
  return (
    <div className="min-h-screen bg-[#070b1d] text-white">
      <header className="border-b border-white/10 bg-[#070b1d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-bold tracking-tight">Xedruo</div>
              <div className="text-[10px] tracking-[0.22em] text-slate-400 uppercase">Group Holdings</div>
            </div>
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.13),transparent_42%)]" />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
            <div className="mx-auto mb-7 w-20 h-20 rounded-3xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-cyan-300" />
            </div>
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-[0.3em] text-cyan-300 uppercase mb-5">
              <ShieldCheck className="w-4 h-4" /> Parent company
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[.98]">
              Xedruo Group<br /><span className="text-cyan-300">Holdings.</span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl leading-8 text-slate-400 max-w-3xl mx-auto">
              Group governance, long-term strategy, capital stewardship and shared technology infrastructure.
              Xedruo Group Holdings provides the direction and oversight that supports its independently operated businesses.
            </p>
            <Link to="/management" className="mt-9 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/15 transition">
              Internal management access <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div><div className="text-sm font-semibold text-white">Governance</div><p className="mt-2 text-sm leading-6 text-slate-400">Group direction, accountability and oversight.</p></div>
            <div><div className="text-sm font-semibold text-white">Strategy & capital</div><p className="mt-2 text-sm leading-6 text-slate-400">Long-term planning and responsible resource allocation.</p></div>
            <div><div className="text-sm font-semibold text-white">Shared infrastructure</div><p className="mt-2 text-sm leading-6 text-slate-400">Technology, identity, standards and group-wide capabilities.</p></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Xedruo Group Holdings
        </div>
      </footer>
    </div>
  );
}
