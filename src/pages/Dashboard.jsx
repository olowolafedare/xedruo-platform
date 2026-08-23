import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Upload, Library, Music2, Wallet, ArrowRight, TrendingUp, Radio, RefreshCw, Globe, Headphones, Star } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { SkeletonCard } from "@/components/app/SkeletonCard";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 } }),
};

const MOCK_STREAM_CHART = [
  { month: "Jan", streams: 1200 }, { month: "Feb", streams: 1900 }, { month: "Mar", streams: 1500 },
  { month: "Apr", streams: 2800 }, { month: "May", streams: 3200 }, { month: "Jun", streams: 2600 },
  { month: "Jul", streams: 4100 },
];

const MOCK_REGIONS = [
  { region: "Nigeria", pct: 42, color: "#3b82f6" },
  { region: "Ghana", pct: 18, color: "#8b5cf6" },
  { region: "UK", pct: 14, color: "#10b981" },
  { region: "USA", pct: 12, color: "#f59e0b" },
  { region: "Kenya", pct: 8, color: "#ef4444" },
  { region: "Others", pct: 6, color: "#6b7280" },
];

const statusColor = {
  live: "bg-green-500/15 text-green-400",
  in_review: "bg-amber-500/15 text-amber-400",
  scheduled: "bg-blue-500/15 text-blue-400",
  draft: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [royalties, setRoyalties] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [u, roy, rel] = await Promise.all([
      xedruo.auth.me().catch(() => null),
      xedruo.entities.RoyaltyStatement.list("-created_date", 50).catch(() => []),
      xedruo.entities.Release.list("-created_date", 20).catch(() => []),
    ]);
    setUser(u);
    setRoyalties(roy);
    setReleases(rel);
    setLoading(false);
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    // Load on open, then refresh exactly once at local midnight each day.
    // No realtime subscriptions or interval polling.
    load();
    let timer;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(() => {
        load();
        scheduleMidnightRefresh();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    };
    scheduleMidnightRefresh();
    return () => window.clearTimeout(timer);
  }, [load]);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const totalStreams = releases.reduce((a, b) => a + (b.streams || 0), 0);
  const availableBalance = royalties.filter(r => r.status === "paid").reduce((a, b) => a + (b.amount || 0), 0);
  const pendingRoyalties = royalties.filter(r => r.status === "pending").reduce((a, b) => a + (b.amount || 0), 0);

  // Sort releases by streams for best performers
  const topSongs = [...releases].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 5);

  // Use real stream data if available, else mock
  const hasRealStreams = releases.some(r => r.streams > 0);
  const chartData = hasRealStreams
    ? releases.slice(0, 7).map(r => ({ month: r.title?.slice(0, 6), streams: r.streams || 0 }))
    : MOCK_STREAM_CHART;

  return (
    <div>
      <PageHeader
        title={`👋 Welcome${firstName ? `, ${firstName}` : ""}`}
        subtitle="Your artist overview. Everything starts here."
        action={
          <Button variant="outline" size="sm" onClick={load} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-muted-foreground">
              {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Top stats row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { label: "Total Streams", value: totalStreams.toLocaleString(), icon: Headphones, color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Total Releases", value: releases.length, icon: Library, color: "text-primary", bg: "bg-primary/10" },
              { label: "Available Balance", value: money(availableBalance), icon: Wallet, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Pending Royalties", value: money(pendingRoyalties), icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div key={label} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} grid place-items-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className={`font-bold text-lg leading-tight ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Total Streams Chart */}
            <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible"
              className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Total Streams</h3>
                  <p className="text-xs text-muted-foreground">Monthly streaming performance</p>
                </div>
                <span className="text-2xl font-bold text-primary">{totalStreams > 0 ? totalStreams.toLocaleString() : "—"}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="streams" stroke="hsl(var(--primary))" fill="url(#streamGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              {!hasRealStreams && (
                <p className="text-xs text-center text-muted-foreground -mt-2">Sample data — real streams appear once your releases go live.</p>
              )}
            </motion.div>

            {/* Top Regions */}
            <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible"
              className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Top Regions</h3>
                  <p className="text-xs text-muted-foreground">Listener locations</p>
                </div>
              </div>
              <div className="space-y-3">
                {MOCK_REGIONS.map(({ region, pct, color }) => (
                  <div key={region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{region}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">Sample data</p>
            </motion.div>
          </div>

          {/* Best Songs Performance */}
          <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible"
            className="mt-5 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-semibold">Best Songs Performance</h3>
                  <p className="text-xs text-muted-foreground">Your top performing releases</p>
                </div>
              </div>
              <Link to="/distribution">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">View All <ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>

            {releases.length === 0 ? (
              <div className="rounded-xl bg-muted/50 p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No songs in your catalog yet.</p>
                <Link to="/distribution">
                  <Button size="sm" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload Your First Song</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(topSongs.length > 0 ? topSongs : releases.slice(0, 5)).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center text-primary text-sm font-bold shrink-0">
                      {r.artwork_url ? <img src={r.artwork_url} className="w-8 h-8 rounded-lg object-cover" alt="" /> : r.title?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.artist}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-primary">{(r.streams || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">streams</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColor[r.status] || ""}`}>
                      {r.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-5 rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center mr-2">Quick actions:</span>
            {[
              { label: "Upload Music", to: "/distribution", icon: Upload },
              { label: "Browse Beats", to: "/producer-suite", icon: Music2 },
              { label: "View Royalties", to: "/royalties", icon: TrendingUp },
              { label: "Sell Tickets", to: "/sell-tickets", icon: Radio },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to}>
                <Button variant="outline" size="sm" className="gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Icon className="w-3.5 h-3.5" />{label}
                </Button>
              </Link>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}