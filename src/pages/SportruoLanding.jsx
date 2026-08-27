import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, LogIn, Trophy, CalendarDays, Newspaper } from "lucide-react";

const features = [
  { title: "Fixtures & results", text: "Follow upcoming fixtures, completed results and competition schedules.", icon: CalendarDays },
  { title: "Teams & players", text: "Explore teams, players, competitions and sports profiles.", icon: Trophy },
  { title: "Sports news", text: "Stay up to date with sports stories, competitions and events.", icon: Newspaper },
];

export default function SportruoLanding() {
  const accent = "#f97316";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Xedruo Group Holdings
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-border">
              <LogIn className="w-4 h-4" /> Login
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-5 py-16 sm:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: `${accent}66`, color: accent, backgroundColor: `${accent}12` }}>
              <span className="text-xl">⚽</span> Sportruo · SPORTS NETWORK
            </div>
            <h1 className="mt-7 text-4xl sm:text-6xl font-black tracking-tight">Everything sports, in one place.</h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl">
              Follow fixtures, results, teams, players, competitions and sports news through the Sportruo platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white" style={{ backgroundColor: accent }}>
                Create your account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold border border-border">Sign in</Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 pb-20">
          <div className="grid md:grid-cols-3 gap-5">
            {features.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="w-6 h-6 mb-5" style={{ color: accent }} />
                <h2 className="font-bold text-lg">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}>
                  <CheckCircle2 className="w-4 h-4" /> Available on Sportruo
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 pb-20">
          <div className="rounded-3xl border p-8 sm:p-12" style={{ borderColor: `${accent}55`, background: `linear-gradient(135deg, ${accent}18, transparent 70%)` }}>
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-widest" style={{ color: accent }}>One Xedruo identity</div>
              <h2 className="mt-3 text-3xl font-bold">Explore Sportruo before you sign in.</h2>
              <p className="mt-3 text-muted-foreground">This is the public Sportruo landing page. Your private account, profile and personalized features remain protected behind authentication.</p>
              <div className="mt-6">
                <Link to="/register" className="inline-flex items-center gap-2 font-semibold" style={{ color: accent }}>Get started <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-5 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-3">
          <span>© Xedruo Group Holdings · Sportruo</span>
          <Link to="/" className="hover:text-foreground">Back to Xedruo</Link>
        </div>
      </footer>
    </div>
  );
}
