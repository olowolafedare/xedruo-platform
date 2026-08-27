import React from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, FileText, Sparkles, Search, Building2, ArrowRight } from 'lucide-react';
import PayAndPlay from './PayAndPlay';

const services = [
  { title: 'AI CV Revamp', text: 'Improve your CV with Hireuo AI while keeping your real experience and qualifications accurate.', icon: FileText },
  { title: 'Premium Job Matching', text: 'Match your career profile with relevant local and international opportunities.', icon: Search },
  { title: 'Career Services', text: 'Access premium career tools and application support.', icon: Sparkles },
  { title: 'Employer Recruitment', text: 'Post jobs, reach candidates and use Hireuo recruitment tools.', icon: Building2 },
];

export default function PayAndPlayHireuo() {
  return (
    <div>
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 grid place-items-center shrink-0"><BriefcaseBusiness /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Hireuo on Pay & Play</p>
                <h1 className="text-2xl font-bold mt-1">Career & recruitment services</h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">Access Hireuo paid services from the Xedruo commerce layer. Your Hireuo service remains connected to your Unified Xedruo ID.</p>
              </div>
            </div>
            <Link to="/hireuo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 px-5 py-3 text-sm font-bold hover:bg-emerald-400">Open Hireuo <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {services.map(({title,text,icon:Icon}) => (
              <Link key={title} to="/hireuo" className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                <Icon className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold mt-3">{title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{text}</p>
                <span className="text-xs text-emerald-400 font-semibold mt-3 inline-flex items-center gap-1">Use in Hireuo <ArrowRight className="w-3 h-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <PayAndPlay />
    </div>
  );
}
