import React, { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSecurity() {
  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError(false);
    if (newPassword !== confirmPassword) { setError(true); setMessage("New password and confirmation do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/auth/password", {
        method:"POST", credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({currentPassword,newPassword}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to change password.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage("Password changed. Other active sessions have been signed out.");
    } catch (err) { setError(true); setMessage(err.message); }
    finally { setBusy(false); }
  };

  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
    <div><h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Administrator security</h3>
      <p className="text-xs text-muted-foreground mt-1">Change the password used to sign in to the Xedruo Platform administrator account.</p></div>
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1"><Label htmlFor="admin-current-password">Current password</Label><Input id="admin-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required /></div>
      <div className="space-y-1"><Label htmlFor="admin-new-password">New password</Label><Input id="admin-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} minLength={12} required /><p className="text-[11px] text-muted-foreground">12+ characters, uppercase, lowercase, number and symbol.</p></div>
      <div className="space-y-1"><Label htmlFor="admin-confirm-password">Confirm new password</Label><Input id="admin-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} minLength={12} required /></div>
      <div className="flex items-end"><Button type="submit" disabled={busy || !currentPassword || !newPassword || !confirmPassword} className="w-full sm:w-auto"><KeyRound className="w-4 h-4 mr-2" />{busy ? "Updating…" : "Change password"}</Button></div>
    </form>
    {message && <p role="status" className={"text-sm rounded-lg p-3 border " + (error ? "border-destructive/40 text-destructive" : "border-border text-foreground")}>{message}</p>}
  </section>;
}
