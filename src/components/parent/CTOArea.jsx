import React from "react";
import { Cpu, Database, Cloud, ShieldCheck, Activity, Code2, Rocket, Network } from "lucide-react";

const services=[
 ["Platform architecture","Xedruo-owned backend and service orchestration",Network],
 ["Neon PostgreSQL","Platform data, projects, schemas and migrations",Database],
 ["Cloudflare R2","Object storage and signed access policies",Cloud],
 ["Bunny CDN","Media delivery, cache and performance",Activity],
 ["Render deployments","Services, builds, releases and runtime health",Rocket],
 ["Identity & API security","Sessions, permissions, API keys and audit controls",ShieldCheck],
 ["Developer platform","Projects, environments, docs, webhooks and SDKs",Code2],
 ["AI application builder","Brief-to-app planning, code workspace, preview and release approvals",Cpu],
];
export default function CTOArea(){
 return <section className="space-y-5">
  <div><h2 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary"/> CTO — Technical Management</h2><p className="text-xs text-muted-foreground mt-1">One technical command centre for all Xedruo platform infrastructure and engineering.</p></div>
  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="font-semibold">Xedruo developer platform</div><p className="text-sm text-muted-foreground mt-1">Combines Supabase-class backend services with a Base44-class AI application builder. These are Xedruo-owned capabilities, not dependencies on either product.</p></div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{services.map(([name,desc,Icon])=><article key={name} className="rounded-xl border border-border bg-card p-4"><Icon className="w-5 h-5 text-primary"/><h3 className="font-semibold mt-3">{name}</h3><p className="text-xs text-muted-foreground mt-1">{desc}</p><span className="inline-block mt-3 text-[11px] text-muted-foreground">Module foundation</span></article>)}</div>
  <div className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">AI app builder delivery stages</h3><ol className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground list-decimal pl-5"><li>Describe an app and confirm requirements</li><li>Generate architecture, schema and API contracts</li><li>Generate code in an isolated workspace</li><li>Preview, test and review security</li><li>Version changes and approve release</li><li>Deploy to Render and monitor runtime</li></ol><p className="text-xs text-muted-foreground mt-3">The builder interface is scaffolded; code generation, sandbox execution and deployment automation require the next backend integration phase.</p></div>
 </section>;
}
