import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, CheckCircle2, ChevronRight, Disc3, LayoutGrid, ShieldCheck, Upload } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { companies } from "@/data/companies";
import PageHeader from "@/components/app/PageHeader";

const retired = new Set(["agruo", "education", "capital", "energy"]);
const extraCompanies = [
  { num: "14", slug: "xedruo-ai", name: "Xedruo AI", tagline: "AI tools & assistance", icon: "🤖", color: "#8b5cf6", route: "/xedruo-ai", desc: "AI assistance for Xedruo companies and the public." },
];

export default function Dashboard() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streamPeriod, setStreamPeriod] = useState("daily");

  useEffect(() => {
    let active = true;
    xedruo.entities.Release.list("-created_date", 50)
      .then((data) => { if (active) setReleases(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setReleases([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const latestRelease = useMemo(() => [...releases].sort((a, b) => {
    const aTime = new Date(a.created_date || a.created_at || a.release_date || 0).getTime();
    const bTime = new Date(b.created_date || b.created_at || b.release_date || 0).getTime();
    return bTime - aTime;
  }))[0] || null;

  const analytics = useMemo(() => {
    const source = latestRelease || {};
    const daily = source.daily_streams_data || source.daily_streams_history || source.streams_daily_history || [];
    const weekly = source.weekly_streams_data || source.weekly_streams_history || source.streams_weekly_history || [];
    const normalize = (items, fallbackTotal) => Array.isArray(items)
      ? items.slice(-7).map((item, index) => ({
          label: item.label || item.day || item.date || `Day ${index + 1}`,
          value: Number(item.value ?? item.streams ?? item.count ?? 0),
        }))
      : [];
    const dailyPoints = normalize(daily);
    const weeklyPoints = normalize(weekly);
    const total = streamPeriod === "weekly"
      ? Number(source.weekly_streams ?? source.streams_weekly ?? source.stream_count_weekly ?? 0)
      : Number(source.daily_streams ?? source.streams_daily ?? source.stream_count_daily ?? 0);
    return {
      points: streamPeriod === "weekly" ? weeklyPoints : dailyPoints,
      total: Number.isFinite(total) ? total : 0,
      hasData: (streamPeriod === "weekly" ? weeklyPoints : dailyPoints).some(p => p.value > 0),
    };
  }, [latestRelease, streamPeriod]);

  const platformBreakdown = useMemo(() => {
    const source = latestRelease || {};
    const raw = source.platform_breakdown || source.platform_streams || source.streams_by_platform || [];
    if (Array.isArray(raw)) return raw.map((p) => ({ name: p.name || p.platform || "Other", streams: Number(p.streams ?? p.value ?? p.count ?? 0) })).filter(p => p.streams >= 0);
    if (raw && typeof raw === "object") return Object.entries(raw).map(([name, value]) => ({ name, streams: Number(value) || 0 }));
    return [];
  }, [latestRelease]);

  const platformTotal = platformBreakdown.reduce((sum, item) => sum + item.streams, 0);

  const status = latestRelease?.status || latestRelease?.distribution_status || "pending";
  const statusLabel = String(status).replaceAll("_", " ");
  const chartMax = Math.max(...analytics.points.map(p => p.value), 1);

  if (loading) {
    return <div className="space-y-6"><PageHeader title="Artist Dashboard" subtitle="Music performance and latest release overview." /><div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading music data…</div></div>;
  }

  if (!latestRelease) {
    return (
      <div className="space-y-6">
        <PageHeader title="Artist Dashboard" subtitle="Music performance and latest release overview." />
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center"><Disc3 className="w-7 h-7 text-primary" /></div>
          <h2 className="text-xl font-semibold mt-4">No releases yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Upload your first release to start managing your music and view release analytics here.</p>
          <Link to="/distribution?tab=upload" className="inline-flex items-center gap-2 mt-5 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"><Upload className="w-4 h-4" /> Upload Music</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Artist Dashboard" subtitle="Your latest release and music performance overview." />

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-4">
          <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Latest Release</p><h2 className="text-xl font-bold mt-1">{latestRelease.title || "Untitled release"}</h2></div>
          <span className="rounded-full px-3 py-1 text-xs font-semibold capitalize bg-primary/10 text-primary">{statusLabel}</span>
        </div>
        <div className="p-5 sm:p-6 grid md:grid-cols-[180px_1fr] gap-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            {latestRelease.artwork_url ? <img src={latestRelease.artwork_url} alt={latestRelease.title || "Release artwork"} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center"><Disc3 className="w-10 h-10 text-muted-foreground" /></div>}
          </div>
          <div className="grid sm:grid-cols-2 gap-5 content-start">
            <div><p className="text-xs text-muted-foreground">Artist</p><p className="font-medium mt-1">{latestRelease.artist || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">ISRC</p><p className="font-medium mt-1">{latestRelease.isrc || latestRelease.ISRC || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Release Date</p><p className="font-medium mt-1">{latestRelease.release_date || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Release Status</p><p className="font-medium mt-1 capitalize">{statusLabel}</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /><p className="text-xs uppercase tracking-widest text-muted-foreground">Streaming Analytics</p></div><h2 className="text-2xl font-bold mt-2">{analytics.total.toLocaleString()}</h2><p className="text-sm text-muted-foreground mt-1">{streamPeriod === "daily" ? "Daily streams" : "Weekly streams"}</p></div>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button onClick={() => setStreamPeriod("daily")} className={streamPeriod === "daily" ? "bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm" : "px-3 py-1.5 rounded-md text-sm text-muted-foreground"}>Daily</button>
            <button onClick={() => setStreamPeriod("weekly")} className={streamPeriod === "weekly" ? "bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm" : "px-3 py-1.5 rounded-md text-sm text-muted-foreground"}>Weekly</button>
          </div>
        </div>
        {analytics.hasData ? (
          <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48">
            {analytics.points.map((point, index) => <div key={`${point.label}-${index}`} className="h-full flex flex-col justify-end items-center gap-2"><div className="w-full max-w-12 rounded-t-md bg-primary/70 min-h-1" style={{height:`${Math.max((point.value/chartMax)*100,2)}%`}} title={`${point.value.toLocaleString()} streams`} /><span className="text-[10px] text-muted-foreground truncate max-w-full">{point.label}</span></div>)}
          </div>
        ) : <div className="mt-6 rounded-xl bg-muted/40 p-8 text-center text-sm text-muted-foreground">Streaming analytics will appear when stream data is available.</div>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Platform Breakdown</p><h2 className="text-lg font-semibold mt-1">Latest release streams</h2></div></div>
        {platformBreakdown.length ? <div className="mt-5 space-y-4">{platformBreakdown.map((item) => { const pct = platformTotal ? Math.round((item.streams / platformTotal) * 100) : 0; return <div key={item.name}><div className="flex justify-between text-sm mb-1.5"><span>{item.name}</span><span className="text-muted-foreground">{item.streams.toLocaleString()} · {pct}%</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{width:`${pct}%`}} /></div></div>; })}</div> : <div className="mt-5 rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">Platform streaming data will appear when available.</div>}
      </section>
    </div>
  );
}
