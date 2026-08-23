import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Upload, Music2, ArrowRight, RefreshCw, CheckCircle, XCircle, FileEdit, ShoppingBag, BarChart3, AlertTriangle } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/app/SkeletonCard";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, type: "spring", stiffness: 280, damping: 22 } }),
};

const STATUS_META = {
  live:      { label: "Live",       color: "bg-green-500/15 text-green-400",  dot: "bg-green-400" },
  in_review: { label: "In Review",  color: "bg-amber-500/15 text-amber-400",  dot: "bg-amber-400" },
  scheduled: { label: "Scheduled",  color: "bg-blue-500/15 text-blue-400",    dot: "bg-blue-400" },
  draft:     { label: "Draft",      color: "bg-muted text-muted-foreground",  dot: "bg-muted-foreground" },
  rejected:  { label: "Rejected",   color: "bg-red-500/15 text-red-400",      dot: "bg-red-400" },
};

const MOCK_MONTHLY = [
  { month: "Feb", streams: 900 }, { month: "Mar", streams: 1400 }, { month: "Apr", streams: 2100 },
  { month: "May", streams: 1800 }, { month: "Jun", streams: 3300 }, { month: "Jul", streams: 2700 },
];

function ReleaseRow({ release, index }) {
  const meta = STATUS_META[release.status] || STATUS_META.draft;
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible"
      className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 hover:bg-muted/60 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center text-primary text-sm font-bold shrink-0 overflow-hidden">
        {release.artwork_url
          ? <img src={release.artwork_url} className="w-9 h-9 object-cover" alt="" />
          : release.title?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{release.title}</div>
        <div className="text-xs text-muted-foreground truncate">{release.artist} · {release.type}</div>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-sm font-semibold text-primary">{(release.streams || 0).toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">streams</div>
      </div>
      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full capitalize shrink-0 font-medium ${meta.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    </motion.div>
  );
}

function EmptyState({ label, ctaLabel, ctaTo }) {
  return (
    <div className="rounded-xl bg-muted/40 p-10 text-center flex flex-col items-center gap-3">
      <p className="text-muted-foreground text-sm">{label}</p>
      {ctaLabel && (
        <Link to={ctaTo}>
          <Button size="sm" variant="outline" className="gap-1.5">{ctaLabel} <ArrowRight className="w-3.5 h-3.5" /></Button>
        </Link>
      )}
    </div>
  );
}

function ArtistCatalogContent() {
  const [releases, setReleases] = useState([]);
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasContent, setHasContent] = useState(true);

  const checkContent = useCallback(async () => {
    const [rel, bts] = await Promise.all([
      xedruo.entities.Release.list("-created_date", 1).catch(() => []),
      xedruo.entities.Beat.list("-created_date", 1).catch(() => []),
    ]);
    setHasContent(rel.length > 0 || bts.length > 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [rel, bts] = await Promise.all([
      xedruo.entities.Release.list("-created_date", 100).catch(() => []),
      xedruo.entities.Beat.list("-created_date", 50).catch(() => []),
    ]);
    setReleases(rel);
    setBeats(bts);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Load on open, then refresh exactly once at local midnight each day.
    // No realtime subscriptions or interval polling.
    load();
    checkContent();
    let timer;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(() => {
        load();
        checkContent();
        scheduleMidnightRefresh();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    };
    scheduleMidnightRefresh();
    return () => window.clearTimeout(timer);
  }, [load, checkContent]);

  const newReleases  = releases.filter(r => r.status === "live" || r.status === "scheduled" || r.status === "in_review");
  const rejected     = releases.filter(r => r.status === "rejected");
  const drafts       = releases.filter(r => r.status === "draft");
  const totalStreams  = releases.reduce((a, b) => a + (b.streams || 0), 0);

  const hasRealStreams = releases.some(r => r.streams > 0);
  const monthlyData   = hasRealStreams
    ? releases.slice(0, 6).map(r => ({ month: r.title?.slice(0, 5), streams: r.streams || 0 }))
    : MOCK_MONTHLY;

  return (
    <div>
      {!hasContent && !loading && (
        <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">No music uploaded yet</p>
            <p className="text-xs text-amber-500 mt-0.5">Upload at least one song or beat to unlock full catalog features like distribution, royalties, and promotion. <Link to="/distribution" className="underline font-semibold">Upload a Song →</Link></p>
          </div>
        </div>
      )}
      <PageHeader
        title="🎵 Artist Catalog"
        subtitle="Manage your releases, beats, and track monthly performance."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Link to="/distribution">
              <Button size="sm" className="gap-2"><Upload className="w-3.5 h-3.5" /> New Release</Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Releases", value: releases.length, icon: Music2, color: "text-primary", bg: "bg-primary/10" },
              { label: "New / Live",     value: newReleases.length, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Rejected",       value: rejected.length,    icon: XCircle,     color: "text-red-400",   bg: "bg-red-500/10" },
              { label: "Drafts",         value: drafts.length,      icon: FileEdit,    color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div key={label} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} grid place-items-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className={`font-bold text-xl leading-tight ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Monthly Analysis */}
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible"
            className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Monthly Analysis</h3>
                  <p className="text-xs text-muted-foreground">Streaming trends over time</p>
                </div>
              </div>
              <span className="text-lg font-bold text-primary">{totalStreams.toLocaleString()} total streams</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="streams" stroke="hsl(var(--primary))" fill="url(#catGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            {!hasRealStreams && <p className="text-xs text-center text-muted-foreground mt-1">Sample data — updates when releases go live.</p>}
          </motion.div>

          {/* Tabbed catalog */}
          <Tabs defaultValue="new">
            <TabsList className="mb-4">
              <TabsTrigger value="new">New Releases <span className="ml-1.5 text-xs bg-green-500/20 text-green-400 rounded-full px-1.5">{newReleases.length}</span></TabsTrigger>
              <TabsTrigger value="drafts">Drafts <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-full px-1.5">{drafts.length}</span></TabsTrigger>
              <TabsTrigger value="rejected">Rejected <span className="ml-1.5 text-xs bg-red-500/20 text-red-400 rounded-full px-1.5">{rejected.length}</span></TabsTrigger>
              <TabsTrigger value="beats">My Beats <span className="ml-1.5 text-xs bg-violet-500/20 text-violet-400 rounded-full px-1.5">{beats.length}</span></TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-2">
              {newReleases.length === 0
                ? <EmptyState label="No new releases yet." ctaLabel="Upload Music" ctaTo="/distribution" />
                : newReleases.map((r, i) => <ReleaseRow key={r.id} release={r} index={i} />)}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-2">
              {drafts.length === 0
                ? <EmptyState label="No drafts saved." ctaLabel="Start a Release" ctaTo="/distribution" />
                : drafts.map((r, i) => <ReleaseRow key={r.id} release={r} index={i} />)}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-2">
              {rejected.length === 0
                ? <EmptyState label="No rejected songs — great work! 🎉" />
                : rejected.map((r, i) => <ReleaseRow key={r.id} release={r} index={i} />)}
            </TabsContent>

            <TabsContent value="beats" className="space-y-2">
              {beats.length === 0 ? (
                <EmptyState label="No beats in your catalog yet." ctaLabel="Browse Marketplace" ctaTo="/producer-suite" />
              ) : (
                beats.map((b, i) => (
                  <motion.div key={b.id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                    className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 hover:bg-muted/60 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 grid place-items-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.producer} · {b.genre} · {b.bpm} BPM</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-violet-400">₦{(b.price || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{b.sales || 0} sales</div>
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default function ArtistCatalog() {
  return <ArtistCatalogContent />;
}