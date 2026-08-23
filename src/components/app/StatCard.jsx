import React from "react";

export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary"><Icon className="w-4 h-4" /></span>}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}