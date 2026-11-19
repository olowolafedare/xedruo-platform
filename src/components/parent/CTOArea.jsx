import React, { useState } from "react";
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
 const [prompt,setPrompt]=useState("");
 const [mode,setMode]=useState("architecture");
 const [answer,setAnswer]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [history,setHistory]=useState([]);
 const ask=async(e)=>{
  e.preventDefault();
  if(!prompt.trim()||busy)return;
  const current=prompt.trim();
  setBusy(true);setError("");setAnswer("");
  try{
   const response=await fetch("/api/cto/ai-assistant",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:current,mode,conversation:history.slice(-8)})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.message||data.error||"Xedrion AI request failed.");
   const result=typeof data.answer==="string"?data.answer:"";
   setAnswer(result);
   setHistory(v=>[...v,{role:"user",content:current},{role:"assistant",content:result}].slice(-12));
   setPrompt("");
  }catch(err){setError(err.message||"Unable to reach Xedrion AI.");}
  finally{setBusy(false);}
 };
 return <section className="space-y-5">
  <div><h2 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary"/> CTO — Technical Management</h2><p className="text-xs text-muted-foreground mt-1">One technical command centre for all Xedruo platform infrastructure and engineering.</p></div>
  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="font-semibold">Xedruo developer platform</div><p className="text-sm text-muted-foreground mt-1">Combines Supabase-class backend services with a Base44-class AI application builder. These are Xedruo-owned capabilities, not dependencies on either product.</p></div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{services.map(([name,desc,Icon])=><article key={name} className="rounded-xl border border-border bg-card p-4"><Icon className="w-5 h-5 text-primary"/><h3 className="font-semibold mt-3">{name}</h3><p className="text-xs text-muted-foreground mt-1">{desc}</p><span className="inline-block mt-3 text-[11px] text-muted-foreground">Module foundation</span></article>)}</div>
  <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary"/> Xedrion AI Engineering Assistant</h3><p className="text-xs text-muted-foreground mt-1">Connected to Xedrion's server-to-server company API. CTO-only access.</p></div><span className="text-[11px] rounded-full border border-border px-2 py-1">API integration</span></div>
   <form onSubmit={ask} className="space-y-3">
    <div className="flex flex-wrap gap-2"><select value={mode} onChange={e=>setMode(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="architecture">Architecture</option><option value="code">Generate code</option><option value="database">Neon database</option><option value="api">API development</option><option value="debug">Debug issue</option><option value="security">Security review</option><option value="review">Code review</option></select></div>
    <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} required maxLength={18000} rows={5} placeholder="Describe the backend service or application capability to build. Xedrion AI will return an implementation plan or code for review." className="w-full rounded-lg border border-input bg-background p-3 text-sm"/>
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Existing platform features must remain unchanged.</span><Button type="submit" disabled={busy||!prompt.trim()}>{busy?"Working with Xedrion…":"Ask Xedrion AI"}</Button></div>
   </form>
   {error&&<p role="alert" className="text-sm text-destructive rounded-lg border border-destructive/30 p-3">{error}</p>}
   {answer&&<div className="rounded-xl border border-border bg-background p-4 space-y-2"><div className="text-xs font-semibold text-muted-foreground">XEDRION AI RESPONSE</div><pre className="whitespace-pre-wrap break-words text-sm font-sans leading-6">{answer}</pre><p className="text-[11px] text-muted-foreground">Generated guidance and code are not automatically applied or deployed.</p></div>}
  </div>
  <div className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">AI app builder delivery stages</h3><ol className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground list-decimal pl-5"><li>Describe an app and confirm requirements</li><li>Generate architecture, schema and API contracts</li><li>Generate code in an isolated workspace</li><li>Preview, test and review security</li><li>Version changes and approve release</li><li>Deploy to Render and monitor runtime</li></ol><p className="text-xs text-muted-foreground mt-3">The builder interface is scaffolded; code generation, sandbox execution and deployment automation require the next backend integration phase.</p></div>
 </section>;
}
