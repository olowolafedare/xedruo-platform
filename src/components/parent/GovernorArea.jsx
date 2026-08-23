import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { companies } from "@/data/companies";
import Stat from "./Stat";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GovernorArea() {
  const [stats, setStats] = useState({ releases: 0, events: 0, orders: 0, tickets: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [releases, events, orders, tickets] = await Promise.all([
          xedruo.entities.Release.list("-created_date", 50),
          xedruo.entities.Event.list("-created_date", 50),
          xedruo.entities.Order.list("-created_date", 50),
          xedruo.entities.SupportTicket.list("-created_date", 50),
        ]);
        setStats({
          releases: releases.length,
          events: events.length,
          orders: orders.length,
          tickets: tickets.length,
        });
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Governor — Group Oversight
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Oversee the entire Xedruo group across all {companies.length} companies.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Companies" value={companies.length} />
        <Stat label="Releases" value={stats.releases} />
        <Stat label="Events" value={stats.events} />
        <Stat label="Orders" value={stats.orders} />
      </div>

      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-display font-semibold mb-3">Company roster</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {companies.map((c) => (
            <Button asChild key={c.slug} variant="outline" size="sm" className="w-full justify-start font-normal">
              <Link to={c.route}>
                <span
                  className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: `${c.color}1a`, color: c.color }}
                >
                  {c.num}
                </span>
                <span className="ml-1.5">{c.icon}</span>
                <span className="ml-1.5 flex-1 text-left truncate">{c.name}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}