import React, { useEffect, useState } from "react";
import { LifeBuoy, Plus, Loader2, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

const statusColor = {
  open: "bg-amber-500/15 text-amber-600",
  in_progress: "bg-blue-500/15 text-blue-600",
  resolved: "bg-green-500/15 text-green-600",
  closed: "bg-muted text-muted-foreground"
};
const priorityColor = {
  low: "text-muted-foreground",
  medium: "text-amber-600",
  high: "text-red-600",
  urgent: "text-red-700 font-semibold"
};

function TicketCard({ ticket, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await xedruo.entities.SupportTicket.update(ticket.id, { response: reply });
    setSending(false);
    setReply("");
    onUpdate();
  };

  return (
    <motion.div layout className="border border-border rounded-2xl bg-card overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{ticket.title}</div>
          <div className="text-sm text-muted-foreground mt-0.5 truncate">{ticket.description}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">{ticket.category}</Badge>
            <span className={`text-xs capitalize ${priorityColor[ticket.priority]}`}>{ticket.priority}</span>
            <span className="text-xs text-muted-foreground">{new Date(ticket.created_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`border-0 capitalize text-xs ${statusColor[ticket.status]}`}>{ticket.status?.replace("_", " ")}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{ticket.description}</p>

              {ticket.response && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <LifeBuoy className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 bg-primary/5 rounded-2xl rounded-tl-sm px-4 py-3 text-sm border border-primary/10">
                    <span className="text-xs font-semibold text-primary block mb-1">Xedruo Support</span>
                    {ticket.response}
                  </div>
                </div>
              )}

              {ticket.status !== "closed" && ticket.status !== "resolved" && (
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Reply to support…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendReply()}
                    className="flex-1 text-sm"
                  />
                  <Button size="icon" onClick={sendReply} disabled={!reply.trim() || sending}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: "other", priority: "medium" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = () => xedruo.entities.SupportTicket.list("-created_date", 30).then(setTickets);
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  const create = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    await xedruo.entities.SupportTicket.create({ ...form, status: "open" });
    setSaving(false);
    setOpen(false);
    setForm({ category: "other", priority: "medium" });
    load();
    toast({ title: "✅ Ticket created", description: "Our team will respond within 24 hours." });
  };

  const statuses = ["all", "open", "in_progress", "resolved", "closed"];
  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>For faster support, make sure you've set up your creator profile by uploading a release or beat. <a href="/distribution" className="underline font-medium">Get started →</a></span>
      </div>
      <PageHeader title="Support Center" subtitle="Get help with your account and platform features."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hover:scale-[1.02] transition-transform"><Plus className="w-4 h-4" />Open Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" />Create Support Ticket</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Subject <span className="text-destructive">*</span></Label><Input value={form.title || ""} onChange={set("title")} placeholder="Brief summary of your issue" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Category</Label>
                    <Select value={form.category} onValueChange={set("category")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["distribution", "payment", "royalty", "technical", "account", "other"].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Priority</Label>
                    <Select value={form.priority} onValueChange={set("priority")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Description <span className="text-destructive">*</span></Label><Textarea rows={4} value={form.description || ""} onChange={set("description")} placeholder="Describe your issue in detail…" /></div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving || !form.title || !form.description} className="gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Ticket"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {statuses.map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">
            {s === "all" ? `All (${tickets.length})` : s.replace("_", " ")}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
            <LifeBuoy className="w-10 h-10 text-muted-foreground" />
            <p className="font-medium">No tickets yet.</p>
            <p className="text-sm text-muted-foreground">Create a support ticket and our team will help you within 24 hours.</p>
          </motion.div>
        )}
        {filtered.map(t => <TicketCard key={t.id} ticket={t} onUpdate={load} />)}
      </div>
    </div>
  );
}