"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, RefreshCcw, Settings2 } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
import { can } from "../lib/permissions";

type IntegrationSettings = {
  moyskladToken?: string | null;
  moyskladAccountId?: string | null;
  oneCBaseUrl?: string | null;
  oneCLogin?: string | null;
  oneCPassword?: string | null;
};

export default function IntegrationsPage() {
  const [moyskladToken, setMoyskladToken] = useState("");
  const [moyskladAccountId, setMoyskladAccountId] = useState("");
  const [oneCBaseUrl, setOneCBaseUrl] = useState("");
  const [oneCLogin, setOneCLogin] = useState("");
  const [oneCPassword, setOneCPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<IntegrationSettings>("/integrations/settings");
      setMoyskladToken(data?.moyskladToken || "");
      setMoyskladAccountId(data?.moyskladAccountId || "");
      setOneCBaseUrl(data?.oneCBaseUrl || "");
      setOneCLogin(data?.oneCLogin || "");
      setOneCPassword(data?.oneCPassword || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Integratsiyalar yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      setError(""); setMessage("");
      await apiJson("/integrations/settings", { method: "POST", body: JSON.stringify({ moyskladToken, moyskladAccountId, oneCBaseUrl, oneCLogin, oneCPassword }) });
      setMessage("Sozlamalar saqlandi");
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Saqlanmadi"); }
  }

  async function testMoysklad() {
    try {
      setError(""); setMessage("");
      const data = await apiJson<{ ok: boolean; message: string }>("/integrations/moysklad/test", { method: "POST" });
      setMessage(data.message || "MoySklad test bajarildi");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "MoySklad ulanmagan"); }
  }

  async function sync(type: "clients" | "products" | "warehouses") {
    try {
      setError(""); setMessage("");
      const data = await apiJson<{ created: number; updated: number; skipped: number }>(`/integrations/moysklad/sync-${type}`, { method: "POST" });
      setMessage(`${type}: created ${data.created}, updated ${data.updated}, skipped ${data.skipped}`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Sync bajarilmadi"); }
  }

  return (
    <AppLayout title="Integrations" subtitle="MoySklad va 1C ulanish sozlamalari.">
      {error ? <Notice type="error">{error}</Notice> : null}
      {message ? <Notice type="success">{message}</Notice> : null}

      <div className="grid grid-cols-[1fr_0.9fr] gap-5">
        <Card icon={<Settings2 size={22} />} title="MoySklad" subtitle="Token, account, test connection va sync">
          <Field label="MoySklad Token"><input value={moyskladToken} onChange={(e) => setMoyskladToken(e.target.value)} className="premium-input" placeholder="Bearer token yoki API token" /></Field>
          <Field label="Account ID"><input value={moyskladAccountId} onChange={(e) => setMoyskladAccountId(e.target.value)} className="premium-input" placeholder="optional" /></Field>
          <div className="mt-6 flex flex-wrap gap-3">
            {can("integrations:edit") ? <button onClick={save} className="premium-button premium-button-primary">Saqlash</button> : null}
            {can("integrations:edit") ? <button onClick={testMoysklad} className="premium-button premium-button-soft">Test Connection</button> : null}
            {can("integrations:sync") ? <button onClick={() => sync("clients")} className="premium-button premium-button-soft">Sync clients</button> : null}
            {can("integrations:sync") ? <button onClick={() => sync("products")} className="premium-button premium-button-soft">Sync products</button> : null}
            {can("integrations:sync") ? <button onClick={() => sync("warehouses")} className="premium-button premium-button-soft">Sync warehouses</button> : null}
          </div>
        </Card>

        <Card icon={<RefreshCcw size={22} />} title="1C Integration" subtitle="Base URL, login va parol">
          <Field label="1C Base URL"><input value={oneCBaseUrl} onChange={(e) => setOneCBaseUrl(e.target.value)} className="premium-input" placeholder="https://..." /></Field>
          <Field label="Login"><input value={oneCLogin} onChange={(e) => setOneCLogin(e.target.value)} className="premium-input" /></Field>
          <Field label="Password"><input value={oneCPassword} onChange={(e) => setOneCPassword(e.target.value)} className="premium-input" type="password" /></Field>
          {can("integrations:edit") ? <button onClick={save} className="premium-button premium-button-primary mt-6">Saqlash</button> : null}
        </Card>
      </div>

      <div className="premium-card mt-5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#315efb]"><Database size={22} /></div>
          <div><h2 className="text-[24px] font-normal tracking-[-0.04em]">Source of truth</h2><p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#7d8ca2]">Tavsiya: MoySklad / 1C — sklad va balans manbai. Operix — CRM, qarz nazorat, analytics, botlar va dashboard. Excel esa backup/import vositasi sifatida qoladi.</p></div>
        </div>
      </div>
    </AppLayout>
  );
}

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="premium-card p-6"><div className="mb-6 flex items-start gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#315efb]">{icon}</div><div><h2 className="text-[24px] font-normal tracking-[-0.04em]">{title}</h2><p className="mt-1 text-[13px] text-[#8aa0ba]">{subtitle}</p></div></div><div className="space-y-4">{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="premium-label">{label}</span>{children}</label>;
}

function Notice({ children, type }: { children: React.ReactNode; type: "success" | "error" }) {
  return <div className={`mb-5 rounded-[22px] border px-5 py-4 text-[14px] ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}><span className="inline-flex items-center gap-2">{type === "success" ? <CheckCircle2 size={18} /> : null}{children}</span></div>;
}
