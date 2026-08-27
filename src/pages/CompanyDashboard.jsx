import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { companies } from "@/data/companies";
import { Bell, ChevronLeft, Search, Plus, ArrowRight, CheckCircle2, Link2, LayoutDashboard, Activity, Settings, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { xedruo } from "@/api/xedruoClient";
import { ensureXedruoId, linkCompany } from "@/lib/xedruoIdentity";

const dashboards = {
  sportruo: { title: "Your Sports Dashboard", subtitle: "Follow fixtures, teams, players and results in one place.", nav: ["Overview", "Fixtures", "Live Scores", "Teams & Players", "News"], stats: [["Following", "0", "teams & players"], ["Upcoming", "0", "fixtures"], ["Alerts", "0", "sports alerts"], ["Saved", "0", "articles"]], cards: [{ title: "Upcoming fixtures", empty: "Your followed fixtures will appear here.", cta: "Explore fixtures" }, { title: "Your teams", empty: "Follow teams to personalize your sports feed.", cta: "Find teams" }] },
  hireuo: { title: "Your Career Dashboard", subtitle: "Manage applications, jobs, candidates and your professional profile.", nav: ["Overview", "Find Jobs", "Applications", "Saved Jobs", "Profile"], stats: [["Applications", "0", "submitted"], ["Saved Jobs", "0", "saved positions"], ["Interviews", "0", "upcoming"], ["Profile", "0%", "completion"]], cards: [{ title: "Recommended jobs", empty: "Complete your profile to receive job recommendations.", cta: "Find jobs" }, { title: "Application activity", empty: "Your application updates will appear here.", cta: "View applications" }] },
  agruo: { title: "Your Agriculture Dashboard", subtitle: "Buy, sell and manage agricultural products and services.", nav: ["Overview", "Marketplace", "Orders", "My Listings", "Farm Profile"], stats: [["Orders", "0", "active orders"], ["Listings", "0", "your products"], ["Favorites", "0", "saved products"], ["Messages", "0", "unread"]], cards: [{ title: "Marketplace activity", empty: "Products and orders will appear here.", cta: "Browse marketplace" }, { title: "Your listings", empty: "List agricultural products or services to get started.", cta: "Add listing" }] },
  healthruo: { title: "Your Health Dashboard", subtitle: "Find providers, manage appointments and organize your health services.", nav: ["Overview", "Find Providers", "Appointments", "Services", "Records"], stats: [["Appointments", "0", "upcoming"], ["Providers", "0", "saved providers"], ["Requests", "0", "open requests"], ["Records", "0", "available records"]], cards: [{ title: "Upcoming appointments", empty: "Your scheduled appointments will appear here.", cta: "Find a provider" }, { title: "Saved providers", empty: "Save trusted providers for quick access.", cta: "Browse providers" }] },
  education: { title: "Your Learning Dashboard", subtitle: "Continue learning, track progress and earn certificates.", nav: ["Overview", "Courses", "My Learning", "Certificates", "Profile"], stats: [["Courses", "0", "enrolled"], ["Progress", "0%", "overall"], ["Certificates", "0", "earned"], ["Hours", "0", "learning"]], cards: [{ title: "Continue learning", empty: "Enroll in a course to start building your learning history.", cta: "Explore courses" }, { title: "Certificates", empty: "Completed-course certificates will appear here.", cta: "View certificates" }] },
  capital: { title: "Your Investment Dashboard", subtitle: "Track opportunities, portfolio activity, returns and statements.", nav: ["Overview", "Opportunities", "Portfolio", "Transactions", "Statements"], stats: [["Portfolio", "₦0", "current value"], ["Investments", "0", "positions"], ["Returns", "₦0", "recorded"], ["Statements", "0", "available"]], cards: [{ title: "Investment opportunities", empty: "Available opportunities will appear here when published.", cta: "Explore opportunities" }, { title: "Portfolio activity", empty: "Your investment activity will appear here.", cta: "View portfolio" }] },
  energy: { title: "Your Energy Dashboard", subtitle: "Manage energy products, service requests, orders and billing.", nav: ["Overview", "Services", "Products", "Requests", "Billing"], stats: [["Requests", "0", "open requests"], ["Orders", "0", "active orders"], ["Services", "0", "scheduled"], ["Balance", "₦0", "account balance"]], cards: [{ title: "Service requests", empty: "Your energy service requests will appear here.", cta: "Request service" }, { title: "Orders & billing", empty: "Orders and invoices will appear here.", cta: "View billing" }] },
  logistics: { title: "Your Logistics Dashboard", subtitle: "Create deliveries, track shipments and manage your logistics activity.", nav: ["Overview", "New Delivery", "Tracking", "Deliveries", "Addresses"], stats: [["Active", "0", "deliveries"], ["Delivered", "0", "completed"], ["In Transit", "0", "shipments"], ["Saved", "0", "addresses"]], cards: [{ title: "Active deliveries", empty: "Live shipment tracking will appear here.", cta: "Create delivery" }, { title: "Recent deliveries", empty: "Completed deliveries will be listed here.", cta: "View deliveries" }] },
  properties: { title: "Your Property Dashboard", subtitle: "Discover properties, save favorites and manage your property activity.", nav: ["Overview", "Browse", "Saved", "My Listings", "Enquiries"], stats: [["Saved", "0", "properties"], ["Enquiries", "0", "sent"], ["Viewings", "0", "scheduled"], ["Listings", "0", "your properties"]], cards: [{ title: "Saved properties", empty: "Save properties you want to revisit.", cta: "Browse properties" }, { title: "Your listings", empty: "List a property when you are ready to sell or rent.", cta: "Add listing" }] },
  spacetruo: { title: "Your Space Dashboard", subtitle: "Discover, book and manage offices, meeting rooms and event spaces.", nav: ["Overview", "Find Spaces", "Bookings", "Favorites", "Profile"], stats: [["Bookings", "0", "upcoming"], ["Favorites", "0", "saved spaces"], ["Requests", "0", "pending"], ["Hours", "0", "booked"]], cards: [{ title: "Upcoming bookings", empty: "Your booked spaces will appear here.", cta: "Find a space" }, { title: "Saved spaces", empty: "Save spaces for faster future bookings.", cta: "Browse spaces" }] },
};

// Distinct customer-facing identity for each operating company. The shared Xedruo identity remains underneath.
const brandThemes = {
  sportruo: { accent: "#f97316", accentSoft: "rgba(249,115,22,.15)", glow: "rgba(249,115,22,.24)", label: "SPORTS NETWORK", motif: "Matchday" },
  hireuo: { accent: "#3b82f6", accentSoft: "rgba(59,130,246,.15)", glow: "rgba(59,130,246,.24)", label: "CAREER NETWORK", motif: "Career" },
  agruo: { accent: "#84cc16", accentSoft: "rgba(132,204,22,.15)", glow: "rgba(132,204,22,.22)", label: "AGRICULTURE MARKET", motif: "Harvest" },
  healthruo: { accent: "#06b6d4", accentSoft: "rgba(6,182,212,.15)", glow: "rgba(6,182,212,.22)", label: "HEALTH SERVICES", motif: "Care" },
  education: { accent: "#6366f1", accentSoft: "rgba(99,102,241,.15)", glow: "rgba(99,102,241,.22)", label: "LEARNING NETWORK", motif: "Learn" },
  capital: { accent: "#14b8a6", accentSoft: "rgba(20,184,166,.15)", glow: "rgba(20,184,166,.22)", label: "INVESTMENT SERVICES", motif: "Growth" },
  energy: { accent: "#eab308", accentSoft: "rgba(234,179,8,.15)", glow: "rgba(234,179,8,.22)", label: "ENERGY SERVICES", motif: "Power" },
  logistics: { accent: "#0ea5e9", accentSoft: "rgba(14,165,233,.15)", glow: "rgba(14,165,233,.22)", label: "LOGISTICS NETWORK", motif: "Move" },
  properties: { accent: "#f43f5e", accentSoft: "rgba(244,63,94,.15)", glow: "rgba(244,63,94,.22)", label: "REAL ESTATE", motif: "Home" },
  spacetruo: { accent: "#8b5cf6", accentSoft: "rgba(139,92,246,.15)", glow: "rgba(139,92,246,.22)", label: "SPACE & VENUES", motif: "Space" },
};

const slugAliases = { sports: "sportruo", sport: "sportruo", hire: "hireuo", agriculture: "agruo", health: "healthruo", education: "education", capital: "capital", energy: "energy", logistics: "logistics", property: "properties", properties: "properties", space: "spacetruo" };

export default function CompanyDashboard() {
  const { slug: rawSlug } = useParams();
  const slug = slugAliases[(rawSlug || "").toLowerCase()] || (rawSlug || "").toLowerCase();
  const company = companies.find((c) => c.slug === slug);
  const config = dashboards[slug];
  const theme = brandThemes[slug];
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState("Overview");

  useEffect(() => {
    let mounted = true;
    xedruo.auth.me().then(async (me) => {
      if (!mounted) return;
      setUser(me);
      try {
        await ensureXedruoId();
        await linkCompany(slug);
        if (mounted) setConnected(true);
      } catch (_) {}
    }).catch(() => {});
    return () => { mounted = false; };
  }, [slug]);

  const initials = useMemo(() => user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U", [user]);

  if (!company || !config || !theme) return <div className="min-h-screen flex items-center justify-center bg-[#070b1d] text-white px-6"><div className="text-center"><div className="text-lg font-semibold">Company dashboard not found.</div><Link to="/" className="inline-flex items-center gap-2 mt-3 font-semibold" style={{ color: "#67e8f9" }}><ChevronLeft className="w-4 h-4" /> Back to Xedruo</Link></div></div>;

  const primaryStyle = { color: theme.accent };
  const softStyle = { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}45` };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> Xedruo</Link>
          <div className="w-px h-5 bg-border" />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border" style={softStyle}>{company.icon}</div>
          <div><div className="font-display font-bold leading-tight">{company.name}</div><div className="text-[10px] font-semibold tracking-[0.16em]" style={primaryStyle}>{theme.label}</div></div>
          <div className="hidden md:block relative w-64 ml-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={`Search ${theme.motif.toLowerCase()}…`} className="pl-9 h-9 bg-secondary/60" /></div>
          <button className="p-2 rounded-lg hover:bg-secondary"><Bell className="w-5 h-5" /></button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: theme.accent }}>{initials}</div>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto flex">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 mb-2">{theme.motif} workspace</div>
          <div className="space-y-1">
            {config.nav.map((item, i) => <button key={item} onClick={() => setActive(item)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${active === item ? "font-semibold" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`} style={active === item ? { backgroundColor: theme.accentSoft, color: theme.accent } : undefined}><span className="w-4 text-center">{i === 0 ? <LayoutDashboard className="w-4 h-4" /> : i === config.nav.length - 1 ? <Settings className="w-4 h-4" /> : <Activity className="w-4 h-4" />}</span>{item}</button>)}
          </div>
          <div className="border-t border-border mt-6 pt-4 space-y-1">
            <Link to="/support" className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground flex items-center gap-2 hover:bg-secondary"><HelpCircle className="w-4 h-4" /> Support</Link>
            <Link to="/" className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground flex items-center gap-2 hover:bg-secondary"><ArrowRight className="w-4 h-4" /> Xedruo Ecosystem</Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-7">
          <div className="rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden border" style={{ background: `linear-gradient(135deg, ${theme.accent}20, transparent 65%)`, borderColor: `${theme.accent}45` }}>
            <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full blur-3xl opacity-50" style={{ background: theme.glow }} />
            <div className="absolute right-7 top-7 opacity-20" style={primaryStyle}><Sparkles className="w-16 h-16" /></div>
            <div className="relative"><div className="text-3xl mb-3">{company.icon}</div><div className="text-xs uppercase tracking-widest font-semibold mb-1" style={primaryStyle}>{company.name} · {theme.motif}</div><h1 className="text-2xl sm:text-3xl font-display font-bold">{config.title}</h1><p className="text-muted-foreground mt-2 max-w-2xl text-sm">{config.subtitle}</p>
              {user?.xedruo_id && <div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg bg-background/60 border border-border px-3 py-1.5 text-xs"><Link2 className="w-3.5 h-3.5" style={primaryStyle} /> Xedruo ID <span className="font-mono font-semibold" style={primaryStyle}>{user.xedruo_id}</span></span>{connected && <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">{config.stats.map(([label, value, note]) => <div key={label} className="rounded-xl bg-card border border-border p-4" style={{ borderTopColor: theme.accent, borderTopWidth: 2 }}><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-display font-bold mt-1">{value}</div><div className="text-[11px] text-muted-foreground mt-1">{note}</div></div>)}</div>

          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-2">{config.nav.map((item) => <Button key={item} size="sm" variant={active === item ? "default" : "outline"} onClick={() => setActive(item)} style={active === item ? { backgroundColor: theme.accent, color: "#fff" } : undefined}>{item}</Button>)}</div>

          <div className="grid xl:grid-cols-2 gap-5">{config.cards.map((card) => <section key={card.title} className="rounded-2xl bg-card border border-border p-6"><div className="flex items-center justify-between gap-3 mb-5"><h2 className="font-display font-semibold">{card.title}</h2><Button size="sm" variant="outline" style={{ borderColor: `${theme.accent}60` }}><Plus className="w-3.5 h-3.5 mr-1" style={primaryStyle} /> {card.cta}</Button></div><div className="py-12 text-center border border-dashed border-border rounded-xl"><div className="text-sm text-muted-foreground">{card.empty}</div><Button size="sm" className="mt-4" style={{ backgroundColor: theme.accent, color: "#fff" }}>{card.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></div></section>)}</div>

          <div className="mt-6 text-xs text-muted-foreground text-center">{company.name} has its own independent customer experience and brand identity, connected to the wider Xedruo ecosystem through one identity.</div>
        </main>
      </div>
    </div>
  );
}
