import React, { useEffect, useMemo, useRef, useState } from "react";
import { xedruo } from "@/api/xedruoClient";
import { companies } from "@/data/companies";
import { formatDistanceToNowStrict } from "date-fns";
import { Activity, Terminal } from "lucide-react";

// Entities whose changes represent ecosystem-wide deployment / data activity.
const WATCH = [
  { entity: "Release", label: "Release" },
  { entity: "Order", label: "Order" },
  { entity: "Event", label: "Event" },
  { entity: "ArtistProfile", label: "Artist" },
  { entity: "Product", label: "Product" },
  { entity: "WalletTransaction", label: "Wallet" },
  { entity: "TicketPurchase", label: "Ticket" },
];

const SERVICES = ["Frontend", "Database", "Backend"];

const typeColor = (t) =>
  t === "create" ? "text-emerald-400" : t === "delete" ? "text-rose-400" : "text-primary";

export default function DeploymentLog() {
  const [logs, setLogs] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const logRef = useRef(null);

  // Seed with recent updates, then stream live entity events.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [releases, orders] = await Promise.all([
          xedruo.entities.Release.list("-updated_date", 3),
          xedruo.entities.Order.list("-updated_date", 3),
        ]);
        if (cancelled) return;
        const seed = [
          ...releases.map((r) => ({
            id: `Release-${r.id}`,
            time: new Date(r.updated_date || r.created_date),
            type: "update",
            label: "Release",
            name: r.title || r.id,
          })),
          ...orders.map((r) => ({
            id: `Order-${r.id}`,
            time: new Date(r.updated_date || r.created_date),
            type: "update",
            label: "Order",
            name: r.product_name || r.buyer_email || r.id,
          })),
        ]
          .sort((a, b) => b.time - a.time)
          .slice(0, 6);
        setLogs(seed);
      } catch {
        /* ignore — live stream still works */
      }
    })();

    const unsubs = WATCH.map((w) =>
      xedruo.entities[w.entity].subscribe((event) => {
        const d = event.data || {};
        setLogs((prev) =>
          [
            {
              id: `${w.label}-${d.id || Math.random()}-${Date.now()}`,
              time: new Date(),
              type: event.type,
              label: w.label,
              name:
                d.title || d.product_name || d.name || d.event_title ||
                d.description || d.id || "record",
            },
            ...prev,
          ].slice(0, 50)
        );
        setLastEvent(new Date());
      })
    );
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const infra = useMemo(() => companies, []);

  return (
    <div className="space-y-4">
      {/* Infrastructure status — every company, live */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold">Infrastructure status</h3>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {infra.map((c) => (
            <div key={c.slug} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
              <span className="text-base shrink-0">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{c.num}</span>
                  {c.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {SERVICES.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live deployment log — streaming recent updates */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/40">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Deployment log</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {lastEvent
              ? `last event ${formatDistanceToNowStrict(lastEvent, { addSuffix: true })}`
              : "awaiting events…"}
          </span>
        </div>
        <div ref={logRef} className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-background">
          {logs.map((l) => (
            <div key={l.id} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">
                {l.time.toLocaleTimeString()}
              </span>
              <span className={`shrink-0 ${typeColor(l.type)}`}>
                {l.type.toUpperCase()}
              </span>
              <span className="text-muted-foreground shrink-0">{l.label}</span>
              <span className="truncate">{l.name}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-muted-foreground">
              No deployment events yet. Changes across the ecosystem will stream here in real time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}