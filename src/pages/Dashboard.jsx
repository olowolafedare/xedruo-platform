import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, ChevronRight, LayoutGrid, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companies } from "@/data/companies";
import PageHeader from "@/components/app/PageHeader";

const retired = new Set(["agruo", "education", "capital", "energy"]);
const extraCompanies = [
  { num: "14", slug: "xedruo-ai", name: "Xedruo AI", tagline: "AI tools & assistance", icon: "🤖", color: "#8b5cf6", route: "/xedruo-ai", desc: "AI assistance for Xedruo companies and the public." },
];

export default function Dashboard() {
  const availableCompanies = useMemo(() => {
    const active = companies.filter((company) => !retired.has(company.slug) && company.slug !== "management");
    const bySlug = new Map(active.map((company) => [company.slug, company]));
    for (const company of extraCompanies) if (!bySlug.has(company.slug)) bySlug.set(company.slug, company);
    return Array.from(bySlug.values());
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xedruo Ecosystem"
        subtitle="Choose a company to open its own workspace. Your Xedruo Identity stays shared underneath."
      />

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Unified Xedruo ID</h2>
          <p className="text-sm text-muted-foreground mt-1">One authenticated identity, separate company workspaces and company-specific data boundaries.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400"><CheckCircle2 className="w-4 h-4" /> Authenticated</div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Xedruo companies</h2>
          <p className="text-sm text-muted-foreground">Open the correct dashboard directly — Music Distribution is no longer the generic fallback.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground"><LayoutGrid className="w-4 h-4" /> {availableCompanies.length} available</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {availableCompanies.map((company) => (
          <Link key={company.slug} to={company.route} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl border" style={{ backgroundColor: `${company.color}15`, borderColor: `${company.color}35` }}>{company.icon}</div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-5">
              <div className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">COMPANY {company.num}</div>
              <h3 className="font-semibold text-lg mt-1">{company.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{company.tagline}</p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium" style={{ color: company.color }}>
              Open workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5 flex items-start gap-3">
        <Building2 className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">Company separation</p>
          <p className="text-xs text-muted-foreground mt-1">Agruo, Xedruo Education, Xedruo Capital and Xedruo Energy are retired from the customer launcher. Music Distribution remains available only through its dedicated music routes.</p>
          <Link to="/distribution" className="inline-flex mt-3"><Button variant="outline" size="sm" className="gap-2">Open Music Distribution <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
