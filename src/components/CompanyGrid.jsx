import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { companies, managementCard } from "@/data/companies";
import { ArrowRight } from "lucide-react";

// Compact dashboard grid: 13 numbered companies (01-13) + Management card (#14).
export default function CompanyGrid({ query = "" }) {
  const entries = useMemo(
    () => [...companies, { ...managementCard, num: "14" }],
    []
  );

  const filtered = useMemo(
    () =>
      query
        ? entries.filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.tagline.toLowerCase().includes(query.toLowerCase())
          )
        : entries,
    [entries, query]
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No services match “{query}”.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
      {filtered.map((c) => {
        const isStaff = c.slug === "management";
        return (
          <Link
            key={c.slug}
            to={c.route}
            className="group relative rounded-xl p-3 bg-card border border-border hover:border-primary/40 transition flex flex-col gap-2 overflow-hidden hover:-translate-y-0.5"
          >
            <div
              className="absolute -right-5 -top-5 w-14 h-14 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition"
              style={{ background: c.color }}
            />
            <div className="flex items-center justify-between relative">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: `${c.color}1a`, border: `1px solid ${c.color}33` }}
              >
                {c.icon}
              </span>
              <span
                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                style={{ background: `${c.color}1a`, color: c.color }}
              >
                {c.num}
              </span>
            </div>
            <div className="min-w-0 relative">
              <div className="text-xs font-semibold truncate flex items-center gap-1">
                <span className="truncate">{c.name}</span>
                {isStaff && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase shrink-0">
                    Staff
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{c.tagline}</div>
            </div>
            <div className="mt-auto inline-flex items-center justify-center gap-1 text-[11px] font-medium rounded-md bg-primary/10 text-primary px-2 py-1 group-hover:bg-primary group-hover:text-primary-foreground transition relative">
              Open <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}