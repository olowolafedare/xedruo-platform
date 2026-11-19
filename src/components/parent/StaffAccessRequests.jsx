import React, { useEffect, useState } from "react";
import { Check, X, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffAccessRequests(){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[busy,setBusy]=useState("");
 const load=async()=>{setLoading(true);setNotice("");try{const r=await fetch("/api/admin/auth/access-requests",{credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Could not load requests.");setRows(d.requests||[]);}catch(e){setNotice(e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const decide=async(id,decision)=>{setBusy(id);setNotice("");try{const r=await fetch("/api/admin/auth/access-requests/"+id,{method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({decision})});const d=await r.json();if(!r.ok)throw new Error(d.message||"Decision failed.");setNotice("Request "+decision+".");await load();}catch(e){setNotice(e.message);}finally{setBusy("");}};
 return <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
  <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary"/> Staff access requests</h3><p className="text-xs text-muted-foreground mt-1">Review requests before any staff account is provisioned.</p></div><Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4 mr-1"/>Refresh</Button></div>
  {notice&&<p className="text-sm text-muted-foreground">{notice}</p>}
  {loading?<p className="text-sm text-muted-foreground">Loading…</p>:rows.length===0?<p className="text-sm text-muted-foreground">No access requests yet.</p>:<div className="space-y-3">{rows.map(x=><article key={x.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium">{x.full_name}</div><div className="text-xs text-muted-foreground">{x.work_email} · {x.requested_unit} · {x.position_title}</div></div><span className="text-xs rounded-full bg-secondary px-2 py-1">{x.status}</span></div><p className="text-sm mt-3 whitespace-pre-wrap">{x.reason}</p>{x.status==="pending"&&<div className="flex gap-2 mt-3"><Button size="sm" onClick={()=>decide(x.id,"approved")} disabled={!!busy}><Check className="w-4 h-4 mr-1"/>Approve</Button><Button size="sm" variant="outline" onClick={()=>decide(x.id,"rejected")} disabled={!!busy}><X className="w-4 h-4 mr-1"/>Reject</Button></div>}</article>)}</div>}
  <p className="text-xs text-muted-foreground">Approval records authorise the next provisioning step; approval does not automatically create login credentials.</p>
 </section>;
}
