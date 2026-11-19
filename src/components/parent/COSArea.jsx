import React, { useState } from "react";
import { ClipboardList, CalendarDays, ListTodo } from "lucide-react";

export default function COSArea(){
 const [items,setItems]=useState([]);
 const [draft,setDraft]=useState("");
 const add=()=>{const title=draft.trim();if(!title)return;setItems(v=>[{id:crypto.randomUUID(),title,done:false},...v]);setDraft("");};
 return <section className="space-y-5">
  <div><h2 className="font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary"/> Chief of Staff — Executive Coordination</h2><p className="text-xs text-muted-foreground mt-1">Coordinate executive actions, meeting follow-ups and cross-unit priorities.</p></div>
  <div className="grid sm:grid-cols-2 gap-3">
   <div className="rounded-xl border border-border bg-card p-5"><CalendarDays className="w-5 h-5 text-primary"/><h3 className="font-semibold mt-3">Executive coordination</h3><p className="text-sm text-muted-foreground mt-1">Central place for executive schedules and meeting actions. Persistent calendar integration is a later connector step.</p></div>
   <div className="rounded-xl border border-border bg-card p-5"><ListTodo className="w-5 h-5 text-primary"/><h3 className="font-semibold mt-3">Action register</h3><p className="text-sm text-muted-foreground mt-1">Track follow-ups during this session.</p><div className="flex gap-2 mt-3"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Add an executive action"/><button onClick={add} className="rounded-md bg-primary text-primary-foreground px-3 text-sm">Add</button></div><div className="mt-3 space-y-2">{items.map(x=><label key={x.id} className="flex gap-2 text-sm"><input type="checkbox" checked={x.done} onChange={()=>setItems(v=>v.map(i=>i.id===x.id?{...i,done:!i.done}:i))}/><span className={x.done?"line-through text-muted-foreground":""}>{x.title}</span></label>)}</div></div>
  </div>
 </section>;
}
