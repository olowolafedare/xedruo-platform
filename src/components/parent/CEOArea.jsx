import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import CompanySelector from "./CompanySelector";
import Stat from "./Stat";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CEOArea() {
  const [company, setCompany] = useState(null);
  const [data, setData] = useState({ releases: [], events: [], products: [], orders: [] });

  useEffect(() => {
    (async () => {
      try {
        const [releases, events, products, orders] = await Promise.all([
          xedruo.entities.Release.list("-created_date", 50),
          xedruo.entities.Event.list("-created_date", 50),
          xedruo.entities.Product.list("-created_date", 50),
          xedruo.entities.Order.list("-created_date", 50),
        ]);
        setData({ releases, events, products, orders });
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" /> CEO — Company Management Oversight
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Select a company to oversee its management.</p>
      </div>

      <CompanySelector onSelect={setCompany} selected={company} />

      {company && (
        <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{company.icon} {company.name}</div>
            <Button asChild variant="outline" size="sm">
              <Link to={company.route}>
                Open company <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Releases" value={data.releases.length} />
            <Stat label="Events" value={data.events.length} />
            <Stat label="Products" value={data.products.length} />
            <Stat label="Orders" value={data.orders.length} />
          </div>
        </div>
      )}
    </div>
  );
}