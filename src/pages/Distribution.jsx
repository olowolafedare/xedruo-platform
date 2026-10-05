import React, { useEffect, useState, useCallback } from "react";
import { Globe, MessageCircle, CheckCircle2, Lock, ChevronRight, Send, Loader2, X, Share2, BarChart3 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import UploadMusicForm from "@/components/distribution/UploadMusicForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PaymentModal from "@/components/app/PaymentModal";
import DSPStatusTracker from "@/components/app/DSPStatusTracker";
import DistributionManager, { PLATFORMS } from "@/components/distribution/DistributionManager";
import { Link } from "react-router-dom";
import { SkeletonList } from "@/components/app/SkeletonCard";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const plans = [
  {
    name: "Artist",
    emoji: "🎵",
    price: "₦30,000/year",
    amount: 30000,
    popular: false,
    features: [
      "Maximum 5 releases per year",
      "Upload Singles, EPs & Albums",
      "Distribution to 150+ stores",
      "Keep 100% royalties",
      "Smart Links",
      "Basic Analytics",
    ],
    cta: "Choose Artist",
  },
  {
    name: "Pro",
    emoji: "👑",
    price: "₦80,000/year",
    amount: 80000,
    popular: true,
    features: [
      "Unlimited Releases",
      "Distribution to 150+ stores",
      "Keep 100% royalties",
      "Publishing Administration",
      "Sync Licensing",
      "YouTube Content ID",
      "Advanced Analytics",
      "Priority Support",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Label",
    emoji: "🏢",
    price: "₦150,000/year",
    amount: 150000,
    popular: false,
    features: [
      "Everything in Pro",
      "Manage up to 5 artists",
      "Unlimited Releases",
      "Dedicated Support",
    ],
    cta: "Choose Label",
  },
];

const statusColor = {
  live: "bg-green-500/15 text-green-600",
  in_review: "bg-amber-500/15 text-amber-600",
  scheduled: "bg-blue-500/15 text-blue-600",
  draft: "bg-muted text-muted-foreground",
};

function DistributionContent() {
  const [releases, setReleases] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [tab, setTab] = useState("overview");
  const [streamPeriod, setStreamPeriod] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const { toast } = useToast();

  const allStoreIds = PLATFORMS.map(p => p.id);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === releases.length ? new Set() : new Set(releases.map(r => r.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDistribute = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      await xedruo.entities.Release.bulkUpdate(ids.map(id => ({
        id,
        status: "draft",
          distribution_status: "preflight_pending",
          preflight_confirmation_required: true,
        platforms: allStoreIds,
        territories: ["worldwide"],
        takedown_status: "none",
        last_distributed_at: new Date().toISOString(),
        $inc: { distribution_attempts: 1 },
      })));
      toast({ title: "🚀 Bulk distribution started", description: `${ids.length} ${ids.length === 1 ? "release" : "releases"} pushed to all ${PLATFORMS.length} stores.` });
      clearSelection();
      load();
    } catch {
      toast({ title: "Bulk distribution failed", variant: "destructive" });
    }
    setBulkBusy(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await xedruo.entities.Release.list("-created_date", 50).catch(() => []);
    setReleases(data);
    if (data.length > 0) setSubscribed(true);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = xedruo.entities.Release.subscribe((event) => {
      if (event.type === "create") {
        setReleases(prev => [event.data, ...prev]);
        toast({ title: "✅ Release submitted!", description: "Your music is now in review." });
      } else if (event.type === "update") {
        setReleases(prev => prev.map(r => r.id === event.data.id ? event.data : r));
        if (event.data.status === "live") {
          toast({ title: "🎉 Your music is live!", description: "Now available on all platforms." });
        }
      }
    });
    return unsub;
  }, [toast]);

  // Overview is always centered on the artist's most recently uploaded release.
  // Use creation time first so a batch of releases uploaded today resolves to the last uploaded one.
  const latestRelease = [...releases].sort((a, b) => {
    const aTime = new Date(a.created_date || a.created_at || a.release_date || 0).getTime();
    const bTime = new Date(b.created_date || b.created_at || b.release_date || 0).getTime();
    return bTime - aTime;
  })[0] || null;
  const shareRelease = async () => {
    if (!latestRelease) return;
    const shareUrl = latestRelease.share_url || (window.location.origin + "/distribution?release=" + latestRelease.id);
    try {
      if (navigator.share) await navigator.share({ title: latestRelease.title || "Xedruo Music release", text: latestRelease.artist ? (latestRelease.title + " by " + latestRelease.artist) : latestRelease.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast({ title: "Shareable link copied" }); }
    } catch (err) { if (err?.name !== "AbortError") toast({ title: "Unable to share release", variant: "destructive" }); }
  };

  const getStreamCount = () => {
    if (!latestRelease) return 0;
    if (streamPeriod === "weekly") return Number(latestRelease.weekly_streams ?? latestRelease.streams_weekly ?? latestRelease.stream_count_weekly ?? 0);
    return Number(latestRelease.daily_streams ?? latestRelease.streams_daily ?? latestRelease.stream_count_daily ?? 0);
  };

  const Overview = () => (
    <TabsContent value="overview">
      {loading ? <SkeletonList rows={2} /> : !latestRelease ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="font-medium">No releases yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Your latest release details will appear here after you upload music.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Latest Release</p><h2 className="text-xl font-bold mt-1">{latestRelease.title || "Untitled release"}</h2></div>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareRelease}><Share2 className="w-4 h-4" /> Share</Button>
            </div>
            <div className="p-5 sm:p-6 grid lg:grid-cols-[260px_1fr] gap-6">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
                {latestRelease.artwork_url ? <img src={latestRelease.artwork_url} alt={latestRelease.title || "Release artwork"} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted-foreground"><Globe className="w-10 h-10" /></div>}
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 content-start">
                <div><p className="text-xs text-muted-foreground">Title</p><p className="font-medium mt-1">{latestRelease.title || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Artist</p><p className="font-medium mt-1">{latestRelease.artist || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Featured Artist</p><p className="font-medium mt-1">{latestRelease.featured_artist || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Genre</p><p className="font-medium mt-1">{latestRelease.genre || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Language</p><p className="font-medium mt-1">{latestRelease.language || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Release Date</p><p className="font-medium mt-1">{latestRelease.release_date || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Distribution Status</p><Badge className={(statusColor[latestRelease.status] || "") + " border-0 capitalize mt-1"}>{(latestRelease.status || latestRelease.distribution_status || "pending").replaceAll("_", " ")}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Play Sync Status</p><p className="font-medium mt-1 capitalize">{(latestRelease.play_sync_status || "pending").replaceAll("_", " ")}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Distribution Targets</p><p className="font-medium mt-1">{latestRelease.distribution_targets?.length ? latestRelease.distribution_targets.join(", ") : "—"}</p></div>
                {latestRelease.lyrics && <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Lyrics</p><p className="text-sm mt-1 whitespace-pre-wrap max-h-40 overflow-auto">{latestRelease.lyrics}</p></div>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Stream Performance</p><h2 className="text-xl font-bold mt-1">{getStreamCount().toLocaleString()}</h2><p className="text-sm text-muted-foreground mt-1">{streamPeriod === "daily" ? "Daily streams" : "Weekly streams"}</p></div>
              <div className="inline-flex rounded-lg border border-border p-1"><button onClick={()=>setStreamPeriod("daily")} className={streamPeriod === "daily" ? "bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm" : "px-3 py-1.5 rounded-md text-sm text-muted-foreground"}>Daily</button><button onClick={()=>setStreamPeriod("weekly")} className={streamPeriod === "weekly" ? "bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm" : "px-3 py-1.5 rounded-md text-sm text-muted-foreground"}>Weekly</button></div>
            </div>
            <div className="mt-5 rounded-xl bg-muted/40 p-5 flex items-center gap-3"><BarChart3 className="w-5 h-5 text-primary"/><span className="text-sm text-muted-foreground">Streaming analytics use available stream data for this release; no stream data is fabricated when the provider has not supplied it.</span></div>
          </section>
        </div>
      )}
    </TabsContent>
  );

  const handleReleaseUpdated = (updated) => {
    setReleases(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelectedRelease(updated);
  };

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setPayModalOpen(true);
  };

  const handlePaySuccess = () => {
    setSubscribed(true);
    setTab("upload");
    localStorage.setItem("xedruo_active_plan", selectedPlan?.name || "Artist");
    toast({ title: "🎉 Plan activated!", description: `Your ${selectedPlan?.name} plan is now active.` });
  };

  const LockedMessage = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-muted grid place-items-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">Choose a Distribution Plan to start releasing your music.</p>
        <p className="text-sm text-muted-foreground mt-1">Subscribe to unlock uploads, releases, and analytics.</p>
      </div>
      <Button onClick={() => setTab("plans")}>View Plans</Button>
    </motion.div>
  );

  return (
    <div>
      <PageHeader title="Xedruo Music Distribution" subtitle="Artist distribution overview" action={<Link to="/distribution/preflight" className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">Preflight QC</Link>} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="upload">Upload Music</TabsTrigger>
          <TabsTrigger value="catalog">My Releases</TabsTrigger>
          <TabsTrigger value="manage">Distribution</TabsTrigger>
        </TabsList>

        {/* Artist Distribution Overview */}
        <Overview />

        {/* Plans */}
        <TabsContent value="plans">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 bg-card p-6 flex flex-col hover:shadow-lg transition-all ${plan.popular ? "border-primary shadow-md shadow-primary/10" : "border-border hover:border-primary/40"}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-4">Most Popular</Badge>
                )}
                <div className="text-2xl mb-1">{plan.emoji}</div>
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="text-2xl font-bold text-primary mb-4">{plan.price}</div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform" variant={plan.popular ? "default" : "outline"} onClick={() => handleChoosePlan(plan)}>
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload">
          {!subscribed && (
            <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10 p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Subscribe to unlock uploads</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">Choose a plan to submit your music for distribution. Preview the form below.</p>
              </div>
              <Button size="sm" onClick={() => setTab("plans")}>View Plans</Button>
            </div>
          )}
          <div className={!subscribed ? "pointer-events-none opacity-50 select-none" : ""}>
            <UploadMusicForm onCreated={load} />
          </div>

          {/* Agent / WhatsApp upload assistance */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-1">Need Help Uploading Your Music?</h3>
            <p className="text-sm text-muted-foreground mb-4">Let our team handle your upload professionally.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-muted rounded-xl p-4">
                <div className="text-lg font-bold">🇳🇬 ₦5,000 per release</div>
                <div className="text-sm text-green-500">≈ $4 USD</div>
                <div className="text-sm text-muted-foreground mt-0.5">Pay locally via Paystack</div>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="text-lg font-bold">🌍 US$5 per release</div>
                <div className="text-sm text-blue-400">≈ ₦6,500 NGN</div>
                <div className="text-sm text-muted-foreground mt-0.5">Pay internationally via Stripe</div>
              </div>
            </div>
            <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2"><MessageCircle className="w-4 h-4" /> Upload via WhatsApp</Button>
            </a>
          </div>
        </TabsContent>

        {/* My Releases */}
        <TabsContent value="catalog">
          {!subscribed && (
            <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10 p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Subscribe to manage releases</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">Your releases will appear here once you have an active plan.</p>
              </div>
              <Button size="sm" onClick={() => setTab("plans")}>View Plans</Button>
            </div>
          )}
          {!subscribed ? (
            <div className="pointer-events-none opacity-50 select-none space-y-3">
              {[
                { title: "Midnight Drive", artist: "Ada O.", genre: "Afrobeats", status: "live" },
                { title: "Golden Era", artist: "DJ Kev", genre: "Amapiano", status: "in_review" },
                { title: "Hustle & Flow", artist: "MC Flame", genre: "Hip-Hop", status: "scheduled" },
              ].map((r, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 grid place-items-center text-primary font-semibold shrink-0">
                    {r.title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{r.artist} · {r.genre}</div>
                  </div>
                  <Badge className={`${statusColor[r.status] || ""} border-0 capitalize shrink-0`}>{r.status.replace("_", " ")}</Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : loading ? <SkeletonList rows={4} /> : (
            <div className="space-y-3">
              {/* Bulk selection toolbar */}
              {releases.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3 flex-wrap sticky top-2 z-10 backdrop-blur">
                  <div className="flex items-center gap-2 pl-1">
                    <Checkbox checked={selectedIds.size === releases.length && releases.length > 0} onCheckedChange={toggleSelectAll} id="select-all" />
                    <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">Select all</Label>
                  </div>
                  {selectedIds.size > 0 && (
                    <>
                      <Badge className="bg-primary/15 text-primary border-0">{selectedIds.size} selected</Badge>
                      <Button size="sm" className="gap-2 ml-auto" onClick={bulkDistribute} disabled={bulkBusy}>
                        {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Distribute to All Stores
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={clearSelection}><X className="w-3.5 h-3.5" />Clear</Button>
                    </>
                  )}
                </div>
              )}
              {releases.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
                  <Globe className="w-10 h-10 text-muted-foreground" />
                  <p className="font-medium">No releases yet.</p>
                  <p className="text-sm text-muted-foreground">Upload your first track to get distributed to 150+ stores.</p>
                  <Button variant="outline" onClick={() => setTab("upload")}>Upload Your First Track</Button>
                </motion.div>
              )}
              {releases.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border bg-card p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer group ${selectedIds.has(r.id) ? "border-primary" : "border-border"}`}
                  onClick={() => setSelectedRelease(selectedRelease?.id === r.id ? null : r)}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                  </div>
                  <div className="w-11 h-11 rounded-lg bg-primary/10 grid place-items-center text-primary font-semibold shrink-0 group-hover:bg-primary/20 transition-colors">
                    {r.title?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{r.artist}{r.genre ? ` · ${r.genre}` : ""}</div>
                  </div>
                  <Badge className={`${statusColor[r.status] || ""} border-0 capitalize shrink-0`}>
                    {r.status?.replace("_", " ")}
                  </Badge>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedRelease?.id === r.id ? "rotate-90" : ""}`} />
                </motion.div>
              ))}
              <AnimatePresence>
                {selectedRelease && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-primary/20 bg-card p-5">
                    <DSPStatusTracker release={selectedRelease} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Distribution Management */}
        <TabsContent value="manage">
          {!subscribed ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Subscribe to a plan to manage distribution.
              <div className="mt-3"><Button size="sm" onClick={() => setTab("plans")}>View Plans</Button></div>
            </div>
          ) : loading ? <SkeletonList rows={3} /> : releases.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
              <Globe className="w-10 h-10 text-muted-foreground" />
              <p className="font-medium">No releases to manage yet.</p>
              <Button variant="outline" onClick={() => setTab("upload")}>Upload Your First Track</Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {releases.map(r => (
                  <button key={r.id} onClick={() => setSelectedRelease(r)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${selectedRelease?.id === r.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center text-primary text-sm font-bold shrink-0 overflow-hidden">
                      {r.artwork_url ? <img src={r.artwork_url} className="w-full h-full object-cover" alt="" /> : r.title?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate max-w-[160px]">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.status?.replace("_", " ")}</div>
                    </div>
                  </button>
                ))}
              </div>
              <DistributionManager release={selectedRelease} onUpdated={handleReleaseUpdated} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        plan={selectedPlan}
        onSuccess={handlePaySuccess}
      />
    </div>
  );
}

export default function Distribution() {
  return <DistributionContent />;
}