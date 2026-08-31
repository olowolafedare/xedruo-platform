import React from "react";
import { companies } from "@/data/companies";
import { ArrowRight } from "lucide-react";

const RETIRED = new Set(["agruo", "education", "capital", "energy"]);

export default function CompanySelector({ onSelect, selected }) {
  const availableCompanies = companies.filter((company) => !RETIRED.has(company.slug));

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availableCompanies.map((c) => {
        const active = selected?.slug === c.slug;
        return (
          <button key={c.slug} onClick={() => onSelect(c)} className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${active ? "bg-primary/10 border-primary/50" : "bg-card border-border hover:border-primary/30"}`}>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md shrink-0" style={{ background: `${c.color}1a`, color: c.color }}>{c.num}</span>
            <span className="text-lg shrink-0">{c.icon}</span>
            <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
            {active && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
