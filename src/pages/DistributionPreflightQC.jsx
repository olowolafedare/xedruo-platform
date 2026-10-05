import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, RefreshCw, ShieldCheck, Upload, XCircle } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/app/PageHeader";
import { useToast } from "@/components/ui/use-toast";

const statusMeta = {
  preflight_pending: ["Pending Analysis", "bg-slate-500/10 text-slate-600", Clock3],
  action_required: ["Action Required", "bg-amber-500/15 text-amber-700", AlertTriangle],
  blocked: ["Blocked", "bg-red-500/15 text-red-700", XCircle],
  ready_for_review: ["Ready for Review", "bg-green-500/15 text-green-700", CheckCircle2],
};

function getQc(release) {
  return release?.preflight_report || {};
}

function ReportStatus({ status }) {
  const meta = statusMeta[status] || statusMeta.preflight_pending;
  const Icon = meta[2];
  return <Badge className={`border-0 gap-1.5 ${meta[1]}`}><Icon className="w-3.5 h-3.5" />{meta[0]}</Badge>;
}

export default function DistributionPreflightQC() {
  const [releases, setReleases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [licenceUrl, setLicenceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const rows = await xedruo.entities.Release.list("-created_date", 100).catch(() => []);
    const pending = rows.filter(r => r.distribution_status === "preflight_pending" || r.preflight_report);
    setReleases(pending);
    if (pending.length && !selected) setSelected(pending[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const qc = getQc(selected);
  const issues = Array.isArray(qc.issues) ? qc.issues : [];
  const blocking = issues.filter(i => i.severity === "blocking" || i.type === "blocking");
  const feedbackIssues = issues.filter(i => i.severity === "feedback" || i.type === "feedback");
  const status = selected?.distribution_status || "preflight_pending";

  const analysisReady = Boolean(qc.analysis_status === "complete" || qc.analyzed_at || qc.completed_at);
  const canConfirm = status !== "blocked" && blocking.length === 0 && feedbackIssues.length === 0 && analysisReady;

  const save = async (nextStatus, extra = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await xedruo.entities.Release.update(selected.id, {
        distribution_status: nextStatus,
        preflight_last_action_at: new Date().toISOString(),
        ...extra,
      });
      setSelected(updated);
      setReleases(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast({ title: "Preflight workflow updated", description: nextStatus === "ready_for_review" ? "Release is ready to be confirmed into distribution review." : "The release review has been updated." });
    } catch (err) {
      toast({ title: "Could not update release", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    const existing = Array.isArray(selected?.preflight_notes) ? selected.preflight_notes : [];
    await save("action_required", { preflight_notes: [...existing, { author: "Xedruo Music Operations", body: feedback.trim(), created_at: new Date().toISOString() }] });
    setFeedback("");
  };

  const requestRefresh = async () => {
    await save("preflight_pending", { preflight_refresh_requested_at: new Date().toISOString(), preflight_report: { ...qc, refresh_requested: true } });
  };

  const confirmReview = async () => {
    await save("ready_for_review", { preflight_confirmation_required: false, preflight_confirmed_at: new Date().toISOString(), preflight_confirmed_by: "Xedruo Music Operations", preflight_licence_reference: licenceUrl || null });
  };

  const tabs = useMemo(() => [
    ["All", releases.length],
    ["Action required", releases.filter(r => ["action_required", "blocked"].includes(r.distribution_status)).length],
    ["Ready", releases.filter(r => r.distribution_status === "ready_for_review").length],
  ], [releases]);

  return <div>
    <PageHeader title="Preflight QC & Content Review" subtitle="Review potential rights and distribution conflicts before a release enters review." />
    <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex gap-4">
      <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold">Xedruo review responsibility</div>
        <p className="text-sm text-muted-foreground mt-1">This workspace is the internal decision point for flagged matches. LabelGrid analysis/evidence can be displayed here when its API report is connected; Xedruo remains responsible for the final decision before confirmation.</p>
      </div>
    </div>

    <div className="grid lg:grid-cols-[320px_1fr] gap-5">
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap gap-2">{tabs.map(([label, count]) => <Badge key={label} variant="secondary">{label}: {count}</Badge>)}</div>
        </div>
        {loading ? <div className="p-8 text-sm text-muted-foreground">Loading releases…</div> :
          releases.length === 0 ? <div className="p-8 text-sm text-muted-foreground">No releases are waiting for Preflight QC.</div> :
          <div className="divide-y divide-border max-h-[680px] overflow-y-auto">{releases.map(r => <button key={r.id} onClick={() => { setSelected(r); setFeedback(""); setLicenceUrl(""); }} className={`w-full p-4 text-left hover:bg-muted/40 ${selected?.id === r.id ? "bg-primary/5" : ""}`}>
            <div className="flex items-start justify-between gap-2"><div className="font-medium truncate">{r.title || "Untitled release"}</div><ReportStatus status={r.distribution_status} /></div>
            <div className="text-sm text-muted-foreground mt-1 truncate">{r.artist || "Unknown artist"}{r.isrc ? ` · ${r.isrc}` : ""}</div>
            <div className="text-xs text-muted-foreground mt-2">{getQc(r).issues?.length || 0} reported issue(s)</div>
          </button>)}</div>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        {!selected ? <div className="min-h-[400px] grid place-items-center text-muted-foreground">Select a release to review.</div> :
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div><div className="text-xs uppercase tracking-wider text-muted-foreground">Release</div><h2 className="text-2xl font-bold mt-1">{selected.title}</h2><p className="text-muted-foreground">{selected.artist}{selected.release_date ? ` · ${selected.release_date}` : ""}</p></div>
            <ReportStatus status={status} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[["Matches", issues.length], ["Blocking", blocking.length], ["Needs feedback", feedbackIssues.length]].map(([label, value]) => <div key={label} className="rounded-xl border border-border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>)}
          </div>

          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Content-matching evidence</h3><p className="text-xs text-muted-foreground mt-1">Existing releases returned by the connected QC provider are shown here.</p></div><FileCheck2 className="w-5 h-5 text-primary" /></div>
            {issues.length === 0 ? <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">No provider report is attached yet. The release remains on Preflight hold until the QC analysis is available and Xedruo can review the result.</div> :
              <div className="mt-4 space-y-3">{issues.map((issue, i) => <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{issue.severity || issue.type || "review"}</Badge><span className="font-medium">{issue.title || "Potential content match"}</span></div>
                <p className="text-sm text-muted-foreground mt-2">{issue.description || "Review the evidence before confirming this release."}</p>
                {Array.isArray(issue.matches) && issue.matches.slice(0, 3).map((m, j) => <div key={j} className="mt-3 rounded-lg bg-muted/40 p-3 text-sm"><div className="font-medium">{m.title || "Existing release"} · {m.artist || "Unknown artist"}</div><div className="text-xs text-muted-foreground mt-1">Release date: {m.release_date || "—"} · ISRC: {m.isrc || "—"}</div>{m.store_url && <a className="text-xs text-primary underline mt-1 inline-block" href={m.store_url} target="_blank" rel="noreferrer">Open store</a>}</div>)}
              </div>)}</div>}
          </div>

          <div className="rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold">Xedruo decision & evidence</h3>
            <div className="space-y-1.5"><Label>Reviewer feedback</Label><Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Explain why the match is legitimate, resolved, or requires further action…" rows={4} /></div>
            <div className="space-y-1.5"><Label>Licence / supporting document reference</Label><Input value={licenceUrl} onChange={e => setLicenceUrl(e.target.value)} placeholder="Paste a secure document reference or URL when applicable" /></div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={submitFeedback} disabled={saving || !feedback.trim()}>Add feedback</Button>
              <Button variant="outline" onClick={requestRefresh} disabled={saving} className="gap-2"><RefreshCw className="w-4 h-4" /> Request fresh analysis</Button>
              <Button onClick={confirmReview} disabled={saving || !canConfirm} className="gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm for review</Button>
            </div>
            {blocking.length > 0 && <div className="text-sm text-red-600 flex items-center gap-2"><XCircle className="w-4 h-4" /> Blocking issues must be resolved before confirmation.</div>}
            {feedbackIssues.length > 0 && <div className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Provide feedback or supporting documentation before confirmation.</div>}
            {Array.isArray(selected.preflight_notes) && selected.preflight_notes.length > 0 && <div className="space-y-2 pt-2">{selected.preflight_notes.slice(-5).map((n, i) => <div key={i} className="rounded-lg bg-muted/40 p-3 text-sm"><div className="font-medium">{n.author}</div><div className="text-muted-foreground mt-1">{n.body}</div></div>)}</div>}
          </div>
        </div>}
      </section>
    </div>
  </div>;
}
