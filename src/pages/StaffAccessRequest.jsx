import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const units = [
  ["chairman","Chairman"],["ceo","CEO"],["cfo","CFO"],["cos","Chief of Staff (COS)"],
  ["operations","Operations"],["customer_service","Customer Service"],["cto","CTO — Technical Management"],
];

export default function StaffAccessRequest() {
  const [form,setForm] = useState({fullName:"",workEmail:"",unit:"",positionTitle:"",reason:"",sponsorEmail:""});
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);
  const update = (key,value) => setForm(v=>({...v,[key]:value}));
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/admin/auth/access-requests",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify(form),
      });
      const data = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.message || "Unable to submit your request.");
      setMessage("Your access request has been submitted for approval. No account or permissions are created until approval.");
      setForm({fullName:"",workEmail:"",unit:"",positionTitle:"",reason:"",sponsorEmail:""});
    } catch(err) { setError(true); setMessage(err.message); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-background text-foreground px-4 py-10">
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4"/> Back to staff login</Link>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-2">
        <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center"><ShieldCheck className="w-5 h-5 text-primary"/></div>
        <h1 className="text-2xl font-bold">Request Xedruo staff access</h1>
        <p className="text-sm text-muted-foreground">Submit this form before requesting an internal account. Access is reviewed and approved by the responsible authority.</p>
        <form onSubmit={submit} className="pt-4 grid sm:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Full legal name</Label><Input required minLength={2} maxLength={160} value={form.fullName} onChange={e=>update("fullName",e.target.value)}/></div>
          <div className="space-y-1"><Label>Work email</Label><Input required type="email" maxLength={254} value={form.workEmail} onChange={e=>update("workEmail",e.target.value)}/></div>
          <div className="space-y-1"><Label>Requested unit</Label><select required value={form.unit} onChange={e=>update("unit",e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Select unit</option>{units.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          <div className="space-y-1"><Label>Position / job title</Label><Input required minLength={2} maxLength={120} value={form.positionTitle} onChange={e=>update("positionTitle",e.target.value)}/></div>
          <div className="sm:col-span-2 space-y-1"><Label>Reason for access</Label><textarea required minLength={10} maxLength={2000} rows={4} value={form.reason} onChange={e=>update("reason",e.target.value)} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Explain your responsibilities and why access is needed."/></div>
          <div className="sm:col-span-2 space-y-1"><Label>Manager / sponsor email (optional)</Label><Input type="email" value={form.sponsorEmail} onChange={e=>update("sponsorEmail",e.target.value)}/></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={busy} className="w-full">{busy?"Submitting…": "Submit access request"} <Send className="w-4 h-4 ml-2"/></Button></div>
        </form>
        {message && <p role="status" className={"text-sm rounded-lg border p-3 "+(error?"border-destructive/40 text-destructive":"border-border")}>{message}</p>}
      </div>
    </div>
  </main>;
}
