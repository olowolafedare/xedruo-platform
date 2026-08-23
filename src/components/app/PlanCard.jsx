import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlanCard({ name, price, period = "/year", features = [], highlight, cta = "Choose plan" }) {
  return (
    <div className={`rounded-2xl border p-7 flex flex-col ${highlight ? "border-primary ring-2 ring-primary/30 bg-card" : "border-border bg-card"}`}>
      {highlight && <span className="self-start text-xs font-semibold uppercase tracking-wide text-primary mb-3">Most popular</span>}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 mb-6">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground text-sm">{period}</span>
      </div>
      <ul className="space-y-3 flex-1 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      <Button variant={highlight ? "default" : "outline"} className="w-full">{cta}</Button>
    </div>
  );
}