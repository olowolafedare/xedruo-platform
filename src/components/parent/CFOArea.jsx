import React, { useEffect, useState } from "react";
import { xedruo } from "@/api/xedruoClient";
import CompanySelector from "./CompanySelector";
import FinancialReporting from "./FinancialReporting";
import Stat from "./Stat";
import { DollarSign, LineChart, Building2 } from "lucide-react";

export default function CFOArea() {
  const [tab, setTab] = useState("report");
  const [company, setCompany] = useState(null);
  const [orders, setOrders] = useState([]);
  const [royalties, setRoyalties] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [o, r] = await Promise.all([
          xedruo.entities.Order.list("-created_date", 50),
          xedruo.entities.RoyaltyStatement.list("-created_date", 50),
        ]);
        setOrders(o);
        setRoyalties(r);
      } catch {}
    })();
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
  const royaltyAmt = royalties.reduce((s, r) => s + (r.amount || 0), 0);

  const tabs = [
    { key: "report", label: "Ecosystem Report", icon: LineChart },
    { key: "records", label: "Company Records", icon: Building2 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> CFO — Financial Oversight
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor real-time performance across the ecosystem, or open a single company's records.
        </p>
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 border border-border w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "report" && <FinancialReporting />}

      {tab === "records" && (
        <div className="space-y-4">
          <CompanySelector onSelect={setCompany} selected={company} />

          {company && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Revenue" value={`₦${revenue.toLocaleString()}`} />
                <Stat label="Royalties" value={`₦${royaltyAmt.toLocaleString()}`} />
                <Stat label="Orders" value={orders.length} />
                <Stat label="Statements" value={royalties.length} />
              </div>

              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="font-display font-semibold mb-3">Recent orders</h3>
                <div className="space-y-2">
                  {orders.slice(0, 6).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between text-sm border-b border-border/50 pb-2"
                    >
                      <span className="truncate">{o.product_name || o.buyer_email || "Order"}</span>
                      <span className="text-muted-foreground shrink-0 ml-3">
                        ₦{(o.amount || 0).toLocaleString()} · {o.status}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-xs text-muted-foreground">No orders recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}