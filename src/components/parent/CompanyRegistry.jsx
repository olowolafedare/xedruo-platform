import React, { useEffect, useState } from "react";
import { Building2, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

async function api(path, options = {}) {
  const response = await fetch("/api/admin/auth/" + path, {
    ...options, credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Request failed.");
  return data;
}
const lines = (value) => (Array.isArray(value) ? value : []).join("\n");

export default function CompanyRegistry() {
  const [companies, setCompanies] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true); setNotice("");
    try {
      const data = await api("companies");
      setCompanies(data.companies || []);
      setDrafts(Object.fromEntries((data.companies || []).map((c) => [c.company_slug, {
        allowedCallbacks: lines(c.allowed_callbacks),
        allowedLogoutUrls: lines(c.allowed_logout_urls),
        enabled: c.enabled,
      }])));
    } catch (error) { setNotice(error.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const update = (slug, key, value) => setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }));
  const save = async (company) => {
    const draft = drafts[company.company_slug];
    setSaving(company.company_slug); setNotice("");
    try {
      const payload = {
        companySlug: company.company_slug,
        allowedCallbacks: draft.allowedCallbacks.split("\n").map((x) => x.trim()).filter(Boolean),
        allowedLogoutUrls: draft.allowedLogoutUrls.split("\n").map((x) => x.trim()).filter(Boolean),
        enabled: draft.enabled,
      };
      await api("companies", { method: "PUT", body: JSON.stringify(payload) });
      setNotice(company.display_name + " settings saved.");
      await load();
    } catch (error) { setNotice(error.message); }
    finally { setSaving(""); }
  };

  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Company Registry & Callback URLs</h3>
      <p className="text-xs text-muted-foreground mt-1">Manage registered company origins, approved OAuth callback URLs and logout destinations. Changes are saved to Neon.</p></div>
      <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
    </div>
    {notice && <div className="text-sm rounded-lg border border-border p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{notice}</div>}
    {loading ? <div className="text-sm text-muted-foreground py-6">Loading registered companies…</div> :
      <div className="space-y-4">{companies.map((company) => {
        const draft = drafts[company.company_slug];
        if (!draft) return null;
        return <div key={company.company_slug} className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="font-medium">{company.display_name}</div><div className="text-xs text-muted-foreground">{company.company_slug}</div><div className="text-xs break-all mt-1 text-muted-foreground">{company.app_origin}</div></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(e) => update(company.company_slug,"enabled",e.target.checked)} /> Enabled</label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-xs font-medium space-y-1">Allowed callback URLs <span className="text-muted-foreground font-normal">(one HTTPS URL per line)</span>
              <textarea className="w-full min-h-20 rounded-lg border border-input bg-background p-2 text-xs font-normal" value={draft.allowedCallbacks} onChange={(e) => update(company.company_slug,"allowedCallbacks",e.target.value)} placeholder="https://company.example/auth/callback" />
            </label>
            <label className="text-xs font-medium space-y-1">Allowed logout URLs <span className="text-muted-foreground font-normal">(one HTTPS URL per line)</span>
              <textarea className="w-full min-h-20 rounded-lg border border-input bg-background p-2 text-xs font-normal" value={draft.allowedLogoutUrls} onChange={(e) => update(company.company_slug,"allowedLogoutUrls",e.target.value)} placeholder="https://company.example/" />
            </label>
          </div>
          <div className="flex justify-end"><Button size="sm" onClick={() => save(company)} disabled={saving === company.company_slug}><Save className="w-3.5 h-3.5 mr-1" />{saving === company.company_slug ? "Saving…" : "Save company settings"}</Button></div>
        </div>;
      })}</div>}
    {!loading && <div className="text-xs text-muted-foreground">{companies.length} registered companies. Callback and logout URLs are restricted to each company's registered HTTPS origin.</div>}
  </section>;
}
