import React, { useEffect, useState } from "react";
import { xedruo } from "@/api/xedruoClient";
import CompanySelector from "./CompanySelector";
import Stat from "./Stat";
import { Headphones } from "lucide-react";

export default function CustomerServiceArea() {
  const [company, setCompany] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setTickets(await xedruo.entities.SupportTicket.list("-created_date", 50));
      } catch {}
    })();
  }, []);

  const open = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" /> Customer Service
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Select the company you are serving.</p>
      </div>

      <CompanySelector onSelect={setCompany} selected={company} />

      {company && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Stat label="Company" value={company.name} />
            <Stat label="Open tickets" value={open} />
            <Stat label="Total tickets" value={tickets.length} />
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="font-display font-semibold mb-3">Support tickets</h3>
            <div className="space-y-2">
              {tickets.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-sm border-b border-border/50 pb-2"
                >
                  <span className="truncate">{t.subject || t.title || "Ticket"}</span>
                  <span className="text-muted-foreground shrink-0 ml-3">{t.status}</span>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-xs text-muted-foreground">No support tickets.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}