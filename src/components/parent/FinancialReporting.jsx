import React, { useEffect, useMemo, useState } from "react";
import { xedruo } from "@/api/xedruoClient";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Activity, RefreshCw } from "lucide-react";
import Stat from "./Stat";

// Ecosystem-wide financial sources. Each maps to an entity, the field holding
// the monetary value, and a filter for what counts toward realized performance.
const SOURCES = [
  { key: "orders", entity: "Order", amountField: "amount", label: "Store", filter: (r) => r.status === "completed" },
  { key: "tickets", entity: "TicketPurchase", amountField: "amount_paid", label: "Tickets", filter: (r) => r.payment_status === "confirmed" || r.payment_status === "free" },
  { key: "wallet", entity: "WalletTransaction", amountField: "amount", label: "Wallet", filter: (r) => r.status === "completed" && r.type === "credit" },
  { key: "royalties", entity: "RoyaltyStatement", amountField: "amount", label: "Royalties", filter: () => true },
  { key: "investments", entity: "Investment", amountField: "amount", label: "Investments", filter: (r) => r.status === "confirmed" },
];

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function FinancialReporting() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async (soft = false) => {
    if (soft) setRefreshing(true);
    try {
      const entries = await Promise.all(
        SOURCES.map(async (s) => {
          const rows = await xedruo.entities[s.entity].list("-created_date", 200);
          return [s.key, rows];
        })
      );
      setData(Object.fromEntries(entries));
      setUpdatedAt(new Date());
    } catch {
      /* ignore — surfaces as empty state */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // Real-time: any entity change anywhere in the ecosystem refreshes the report.
    const unsubs = SOURCES.map((s) => xedruo.entities[s.entity].subscribe(() => load(true)));
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const totals = useMemo(() => {
    const t = {};
    SOURCES.forEach((s) => {
      t[s.key] = (data[s.key] || []).filter(s.filter).reduce((sum, r) => sum + (r[s.amountField] || 0), 0);
    });
    t.gross = t.orders + t.tickets + t.wallet + t.royalties + t.investments;
    return t;
  }, [data]);

  const chartData = useMemo(
    () => SOURCES.map((s) => ({ name: s.label, value: totals[s.key] || 0 })),
    [totals]
  );

  const feed = useMemo(() => {
    const items = [];
    SOURCES.forEach((s) => {
      (data[s.key] || []).slice(0, 30).forEach((r) => {
        items.push({
          id: r.id,
          source: s.label,
          title: r.product_name || r.event_title || r.description || r.period || s.label,
          amount: r[s.amountField] || 0,
          date: r.created_date,
          status: r.status || r.payment_status,
        });
      });
    });
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Live header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          Live ecosystem report
          {updatedAt && (
            <span className="text-xs text-muted-foreground font-normal">
              · updated {updatedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Gross inflow" value={naira(totals.gross)} />
        <Stat label="Store sales" value={naira(totals.orders)} />
        <Stat label="Ticket sales" value={naira(totals.tickets)} />
        <Stat label="Wallet volume" value={naira(totals.wallet)} />
        <Stat label="Royalties" value={naira(totals.royalties)} />
        <Stat label="Investments" value={naira(totals.investments)} />
      </div>

      {/* Breakdown chart */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold">Revenue breakdown by source</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => naira(v)}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time activity feed */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-display font-semibold mb-3">Recent activity across ecosystem</h3>
        <div className="space-y-2">
          {feed.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 gap-3">
              <div className="min-w-0">
                <span className="truncate block">{f.title}</span>
                <span className="text-[11px] text-muted-foreground">{f.source} · {f.status || "—"}</span>
              </div>
              <span className="text-muted-foreground shrink-0">{naira(f.amount)}</span>
            </div>
          ))}
          {feed.length === 0 && (
            <p className="text-xs text-muted-foreground">No financial activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}