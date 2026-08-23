import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { companies } from "@/data/companies";
import { ChevronLeft, Search, Bell, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { xedruo } from "@/api/xedruoClient";
import { ensureXedruoId, linkCompany } from "@/lib/xedruoIdentity";
import { CheckCircle2, Link2 } from "lucide-react";

// Per-company content blocks. Each company gets a hero + feature cards + an empty-state list.
const content = {
  sportruo: {
    features: ["Live scores", "Fixtures", "Teams & players", "Results", "Sports news"],
    list: { title: "Latest fixtures", empty: "No fixtures scheduled yet.", cta: "Add fixture" },
  },
  hireuo: {
    features: ["Post a job", "Search candidates", "Applications", "Employer dashboard", "Candidate dashboard"],
    list: { title: "Open positions", empty: "No jobs posted yet.", cta: "Post a job" },
  },
  adom: {
    features: ["Create campaign", "Audience targeting", "Budget", "Analytics", "Ad management"],
    list: { title: "Active campaigns", empty: "No campaigns yet.", cta: "Create campaign" },
  },
  agruo: {
    features: ["Marketplace", "Farm profiles", "Products", "Orders", "Farmer dashboard"],
    list: { title: "Marketplace listings", empty: "No listings yet.", cta: "Add product" },
  },
  healthruo: {
    features: ["Find providers", "Appointments", "Provider profiles", "Categories", "Records"],
    list: { title: "Healthcare providers", empty: "No providers listed yet.", cta: "Add provider" },
  },
  education: {
    features: ["Courses", "Enroll", "Lessons", "Progress", "Certificates"],
    list: { title: "Available courses", empty: "No courses published yet.", cta: "Create course" },
  },
  capital: {
    features: ["Opportunities", "Portfolio", "Investment history", "Returns", "Statements"],
    list: { title: "Investment opportunities", empty: "No opportunities available yet.", cta: "Add opportunity" },
  },
  energy: {
    features: ["Energy services", "Products", "Service requests", "Orders", "Billing"],
    list: { title: "Service requests", empty: "No requests yet.", cta: "Request service" },
  },
  logistics: {
    features: ["New delivery", "Pickup", "Drop-off", "Tracking", "Drivers"],
    list: { title: "Active deliveries", empty: "No deliveries in progress.", cta: "Create delivery" },
  },
  properties: {
    features: ["Listings", "Buy", "Rent", "Sell", "Favorites"],
    list: { title: "Property listings", empty: "No properties listed yet.", cta: "Add listing" },
  },
  spacetruo: {
    features: ["Offices", "Event spaces", "Meeting rooms", "Availability", "Bookings"],
    list: { title: "Available spaces", empty: "No spaces listed yet.", cta: "Add space" },
  },
};

export default function CompanyDashboard() {
  const { slug } = useParams();
  const company = companies.find((c) => c.slug === slug);
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    xedruo
      .auth
      .me()
      .then(async (me) => {
        setUser(me);
        // Connect this customer to the company using their existing Xedruo identity.
        // Ensures a Xedruo ID exists first (never creates a second one).
        await ensureXedruoId();
        await linkCompany(slug);
        setConnected(true);
      })
      .catch(() => {});
  }, [slug]);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Company not found. <Link to="/ecosystem" className="text-primary ml-2">Back to Xedruo</Link>
      </div>
    );
  }

  const c = content[slug] || { features: [], list: { title: "Activity", empty: "No data yet.", cta: "Get started" } };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/ecosystem" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> Xedruo
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: `${company.color}1a` }}>
            {company.icon}
          </div>
          <span className="font-display font-bold">{company.name}</span>
          <div className="hidden sm:flex flex-1 max-w-xs ml-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9 h-9 bg-secondary/60" />
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary ml-auto sm:ml-0"><Bell className="w-5 h-5" /></button>
          {user && (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-primary-foreground">
              {user.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${company.color}22, transparent)`, border: `1px solid ${company.color}33` }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: company.color }} />
          <div className="text-3xl mb-2">{company.icon}</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">{company.name}</h1>
          <p className="text-muted-foreground mt-1 max-w-lg text-sm">{company.desc}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {c.features.map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/70 border border-border">
                {f}
              </span>
            ))}
          </div>
          {user?.xedruo_id && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 border border-border px-3 py-1.5">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                Xedruo ID <span className="font-mono font-semibold text-primary">{user.xedruo_id}</span>
              </span>
              {connected && (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected to your Xedruo identity
                </span>
              )}
            </div>
          )}
        </div>

        {/* List / empty state */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">{c.list.title}</h2>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" /> {c.list.cta}
            </Button>
          </div>
          <div className="py-12 text-center text-muted-foreground">
            <div className="text-sm">{c.list.empty}</div>
            <Button size="sm" className="mt-4">
              {c.list.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground text-center">
          Connect a custom domain for {company.name} from your workspace settings. External integrations (Supabase, GitHub, Render, Vercel) can be linked via backend functions once configured.
        </div>
      </main>
    </div>
  );
}