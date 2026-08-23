import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { companies } from "@/data/companies";
import {
  ChevronLeft, Cpu, ArrowUpRight, Settings, GitBranch, Globe, ShieldCheck,
  ArrowRight, Server, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DeploymentLog from "@/components/dev/DeploymentLog";

// Future deployment / development workflow targets for each company application.
const DEPLOY_TARGETS = [
  { key: "github", label: "GitHub", desc: "Source control & CI", icon: GitBranch },
  { key: "vercel", label: "Vercel", desc: "Frontend hosting", icon: Globe },
  { key: "supabase", label: "Supabase", desc: "Database & auth", icon: Server },
  { key: "render", label: "Render", desc: "Backend services", icon: Rocket },
];

export default function DeveloperWorkstation() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    xedruo.auth.me().then(setUser).catch(() => {});
  }, []);

  // Music Distribution is existing and is never rebuilt — exclude it from the project grid.
  const projects = companies.filter((c) => c.slug !== "music-distribution");

  const notifyComingSoon = (label) =>
    toast({
      title: `${label} integration — coming soon`,
      description: "Development and deployment workflow connections will be available in a future release.",
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/management" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> Parent Company
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold leading-none">Xedruo Internal Development Center</div>
            <div className="text-[11px] text-muted-foreground">Select a company · Work on its application</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl p-5 mb-6 bg-card border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" /> Authorized developer
          </div>
          <p className="text-sm">
            Select a Xedruo company to work on its standalone application. Each company is an
            <span className="font-medium text-foreground"> independent, domain-ready project</span> —
            manage and deploy them without merging their customer applications.
          </p>
        </div>

        {!selected ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSelected(c)}
                className="text-left rounded-2xl bg-card border border-border hover:border-primary/40 transition overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: `${c.color}1a`, color: c.color }}
                      >
                        {c.num}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${c.color}1a` }}
                      >
                        {c.icon}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-emerald-400 font-medium">Standalone</span>
                  </div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.desc}</p>
                </div>
                <div className="px-5 py-3 border-t border-border text-xs text-primary font-medium inline-flex items-center gap-1">
                  Select &amp; work <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" /> All projects
            </button>

            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${selected.color}1a` }}
                >
                  {selected.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: `${selected.color}1a`, color: selected.color }}
                    >
                      {selected.num}
                    </span>
                    <h2 className="font-display font-bold">{selected.name}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={selected.route}>
                  <Button size="sm">
                    <Settings className="w-3.5 h-3.5 mr-1" /> Work on application
                  </Button>
                </Link>
                <Link to={selected.route}>
                  <Button size="sm" variant="outline">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Open live app
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-display font-semibold mb-1">Development &amp; deployment workflows</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Connect this company's application to external dev/deploy services. (Future ability — integrations are coming soon.)
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEPLOY_TARGETS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className="rounded-xl border border-border p-4">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-2">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground mb-3">{t.desc}</div>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => notifyComingSoon(t.label)}>
                        Connect
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DeploymentLog />

        {/* Existing Music Distribution — do not rebuild */}
        <div className="mt-6 rounded-2xl p-5 bg-card border border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg">🎵</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Xedruo Music Distribution</h3>
                <span className="text-[10px] uppercase tracking-wide text-amber-400 font-medium">Existing · Do not rebuild</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standalone existing platform. Managed here as a project only — never rebuilt, replaced or merged.
              </p>
            </div>
            <Link to="/distribution">
              <Button size="sm" variant="outline">Open project</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}