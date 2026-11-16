import React,{useEffect,useState} from "react";
import {UserPlus,UserRound,ShieldCheck,UserX,RefreshCw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

const departments=["Executive Office","Finance","Human Resources","Customer Service","Technical Operations","Product & Engineering","Operations"];
const baseRoles=[["developer","Developer"],["technical_officer","Technical Officer"],["customer_service","Customer Service"],["operations","Operations"]];
const privilegedRoles=[["hr","HR Manager"],["ceo","CEO"],["cfo","CFO"]];
const request=async(path,options={})=>{const r=await fetch("/api/admin/staff/"+path,{...options,credentials:"same-origin",headers:{"content-type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||"Staff operation failed.");return d;};

export default function HRArea({isGovernor=false}){
 const [staff,setStaff]=useState([]),[username,setUsername]=useState(""),[password,setPassword]=useState(""),[department,setDepartment]=useState("Product & Engineering"),[role,setRole]=useState("developer"),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(false);
 const load=async()=>{try{const d=await request("list",{method:"GET"});setStaff(d.staff||[]);}catch(e){setError(true);setMessage(e.message);}};
 useEffect(()=>{load();},[]);
 const create=async(e)=>{e.preventDefault();setBusy(true);setMessage("");setError(false);try{await request("create",{method:"POST",body:JSON.stringify({username,password,department,role})});setUsername("");setPassword("");setMessage("Staff account created. Give the employee their username and initial password securely.");await load();}catch(e){setError(true);setMessage(e.message);}finally{setBusy(false);}};
 const changeStatus=async(person)=>{setMessage("");try{await request(person.status==="active"?"suspend":"activate",{method:"POST",body:JSON.stringify({id:person.id})});await load();setMessage(person.status==="active"?"Staff access suspended.":"Staff account reactivated.");}catch(e){setError(true);setMessage(e.message);}};
 const roleOptions=isGovernor?[...baseRoles,...privilegedRoles]:baseRoles;
 return <div className="space-y-5">
  <div><h2 className="font-display font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary"/> Human Resources — Staff Accounts</h2><p className="text-xs text-muted-foreground mt-1">Create staff usernames and initial passwords directly. No invitation email is required.</p></div>
  <form onSubmit={create} className="rounded-2xl border border-border bg-card p-5 space-y-4">
   <div className="flex items-center gap-2 font-semibold"><UserPlus className="w-4 h-4"/> Create staff account</div>
   <div className="grid sm:grid-cols-2 gap-3">
    <div className="space-y-1"><Label htmlFor="staff-username">Username</Label><Input id="staff-username" value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" placeholder="e.g. jane.dev" required/></div>
    <div className="space-y-1"><Label htmlFor="staff-password">Initial password</Label><Input id="staff-password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} placeholder="12+ characters, mixed case, number and symbol" required/></div>
    <div className="space-y-1"><Label htmlFor="staff-department">Department</Label><select id="staff-department" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={department} onChange={e=>setDepartment(e.target.value)}>{departments.map(v=><option key={v}>{v}</option>)}</select></div>
    <div className="space-y-1"><Label htmlFor="staff-role">Assigned role</Label><select id="staff-role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={role} onChange={e=>setRole(e.target.value)}>{roleOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
   </div>
   <p className="text-xs text-muted-foreground">New staff must change this initial password on their first login. HR can create ordinary staff roles; executive and HR administrator roles are restricted to the Governor.</p>
   <Button type="submit" disabled={busy||!username.trim()||!password}><UserPlus className="w-4 h-4 mr-2"/>{busy?"Creating account…":"Create staff account"}</Button>
  </form>
  {message&&<p role="status" className={"rounded-lg border p-3 text-sm "+(error?"border-destructive/40 text-destructive":"border-border")}>{message}</p>}
  <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
   <div className="flex items-center justify-between"><h3 className="font-semibold">Staff directory</h3><Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1"/>Refresh</Button></div>
   <div className="space-y-2">{staff.map(person=><div key={person.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"><UserRound className="w-4 h-4"/></div>
    <div className="min-w-0 flex-1"><div className="font-medium text-sm">{person.username||person.email||"Staff account"}</div><div className="text-xs text-muted-foreground">{person.department||"Unassigned"} · {String(person.role).replaceAll("_"," ")}</div></div>
    <span className={"text-xs rounded-full px-2 py-1 "+(person.status==="active"?"bg-emerald-500/10 text-emerald-600":"bg-muted text-muted-foreground")}>{person.status}</span>
    {person.role!=="governor"&&<Button size="sm" variant="outline" disabled={person.status==="suspended"&&false} onClick={()=>changeStatus(person)}>{person.status==="active"?<><UserX className="w-3.5 h-3.5 mr-1"/>Suspend</>:"Reactivate"}</Button>}
   </div>)}{staff.length===0&&<p className="text-sm text-muted-foreground">No staff accounts found.</p>}</div>
  </section>
 </div>;
}
