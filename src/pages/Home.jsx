import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/marketing/Footer";

const products = [
  { icon: "🎵", title: "Distribution", desc: "Distribute your music to 150+ stores worldwide. Keep 100% of your royalties.", to: "/distribution" },
  { icon: "📢", title: "Promotion", desc: "Expert campaigns across Spotify, TikTok, Apple Music, and more.", to: "/promotion" },
  { icon: "🎹", title: "Producer Suite", desc: "Upload beats, set your price, and earn 80% on every sale.", to: "/producer-suite" },
  { icon: "💳", title: "Creator Payments", desc: "Creator wallet, payment links, invoices and royalty management.", to: "/creator-payments" },
  { icon: "🎟️", title: "Sell Tickets", desc: "Create events, sell tickets, and manage attendees with built-in revenue splits.", to: "/sell-tickets" },
  { icon: "📈", title: "Invest", desc: "Buy equity in Xedruo and grow with the platform you use.", to: "/invest" },
];

const faqs = [
  { q: "Do I keep 100% of my royalties?", a: "Yes. Xedruo charges a flat subscription fee only. All royalties from streaming and downloads go entirely to you." },
  { q: "How fast does my music go live?", a: "Most releases are approved and distributed within 24–72 hours. Priority support plans get faster turnaround." },
  { q: "Can I manage multiple artists or a label?", a: "Yes. The Label plan supports up to 5 artists with a shared dashboard, reporting, and team access." },
  { q: "What currencies are supported?", a: "Xedruo supports NGN, USD, GBP, EUR, GHS, KES, and ZAR across payments, transfers and wallets." },
  { q: "Is my music and payment data secure?", a: "All data is encrypted and protected. We support KYC verification and optional two-factor authentication." },
];

export default function Home() {
  useEffect(() => {
    xedruo.auth.isAuthenticated().then(authed => {
      if (authed) window.location.href = "/dashboard";
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0a1628", color: "#fff" }}>
      {/* Hero — full screen image */}
      <section className="relative overflow-hidden" style={{ height: "100vh" }}>
        <img
          src="https://media.xedruo.com/images/public/6a6e1673ce0eef4b702181b5/bd5806255_file_00000000ee8082438740926b743aac75.png"
          alt="Xedruo Landing"
          className="absolute inset-0 w-full h-full object-contain object-center"
        />
        {/* CTA buttons at bottom */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-wrap gap-4 justify-center z-10">
          <Link to="/register">
            <Button size="lg" className="h-12 px-10 text-base font-semibold" style={{ background: "#3b82f6", color: "#fff", border: "none" }}>
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="h-12 px-10 text-base font-semibold" style={{ borderColor: "rgba(255,255,255,0.6)", color: "#fff", background: "rgba(0,0,0,0.3)" }}>
              View Plans
            </Button>
          </Link>
        </div>
      </section>

      {/* Product Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20" style={{ background: "#0a1628" }}>
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">Everything, in one ecosystem</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">Six powerful products built to take creators from upload to income.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.title} to={p.to}
              className="group relative rounded-2xl p-7 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-white">{p.title}</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{p.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-400">
                Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20" style={{ background: "#0a1628" }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-white">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="font-semibold mb-2 text-white">{f.q}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24" style={{ background: "#0a1628" }}>
        <div className="rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a4080 100%)", border: "1px solid rgba(59,130,246,0.3)" }}>
          <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full blur-2xl" style={{ background: "rgba(59,130,246,0.15)" }} />
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-white">Ready to build your career?</h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">Join Xedruo today and get everything you need in one place.</p>
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold" style={{ background: "#3b82f6", color: "#fff", border: "none" }}>
              Create your account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}