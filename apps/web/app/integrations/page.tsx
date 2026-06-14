"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, RefreshCcw, Save, XCircle } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Settings = {
  moyskladToken?: string;
  moyskladApiUrl?: string;
  oneCBaseUrl?: string;
  oneCLogin?: string;
  oneCPassword?: string;
  status?: {
    moysklad?: boolean;
    oneC?: boolean;
  };
};

type HistoryItem = {
  id: string;
  createdAt: string;
  source: string;
  type: string;
  status: string;
  message: string;
};

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<Settings>({
    moyskladApiUrl: "https://api.moysklad.ru/api/remap/1.2",
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mode, setMode] = useState<"MOYSKLAD" | "ONE_C">("MOYSKLAD");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isMoysklad = mode === "MOYSKLAD";

  async function load() {
    try {
      setError("");
      const [settingsData, historyData] = await Promise.all([
        apiJson<Settings>("/integrations/settings"),
        apiJson<HistoryItem[]>("/integrations/history"),
      ]);

      setSettings(settingsData || {});
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Integratsiya yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      setLoading("save");
      setError("");
      setMessage("");

      await apiJson("/integrations/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });

      setMessage("Saqlandi. Endi ulanishni tekshir.");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Saqlanmadi");
    } finally {
      setLoading("");
    }
  }

  async function run(path: string, label: string) {
    try {
      setLoading(label);
      setError("");
      setMessage("");

      const result = await apiJson<any>(path, { method: "POST" });

      setMessage(result?.message || "Bajarildi");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik");
      await load();
    } finally {
      setLoading("");
    }
  }

  const currentTestPath = isMoysklad ? "/integrations/moysklad/test" : "/integrations/onec/test";
  const currentClientsPath = isMoysklad ? "/integrations/moysklad/sync-clients" : "/integrations/onec/sync-clients";
  const currentAllPath = isMoysklad ? "/integrations/moysklad/sync-all" : "/integrations/onec/sync-all";

  return (
    <AppLayout title="Integratsiyalar" subtitle="MoySklad va 1C ni oddiy ulash.">
      <div className="mx-auto max-w-[1180px]">
        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <TabCard title="MoySklad" subtitle="API token" active={isMoysklad} connected={Boolean(settings.status?.moysklad)} onClick={() => setMode("MOYSKLAD")} />
          <TabCard title="1C" subtitle="URL + login" active={!isMoysklad} connected={Boolean(settings.status?.oneC)} onClick={() => setMode("ONE_C")} />
        </div>

        <div className="rounded-[26px] border border-[#e7edf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#eef4ff] text-[#315efb]">
              <PlugZap size={20} />
            </div>
            <div>
              <h2 className="text-[23px] font-normal tracking-[-0.04em] text-[#111827]">
                {isMoysklad ? "MoySklad ulash" : "1C ulash"}
              </h2>
              <p className="text-[13px] text-[#8aa0ba]">
                {isMoysklad ? "Token orqali mahsulot, ombor, qoldiq va mijozlarni sync qiladi." : "1C HTTP service ma’lumotlari."}
              </p>
            </div>
          </div>

          {isMoysklad ? (
            <div className="space-y-3">
              <Field label="API token">
                <input value={settings.moyskladToken || ""} onChange={(event) => setSettings({ ...settings, moyskladToken: event.target.value })} className="h-12 w-full rounded-[16px] border border-[#dfe8f3] bg-white px-4 text-[14px] outline-none focus:border-[#315efb]" placeholder="MoySklad token" />
              </Field>

              <details className="rounded-[18px] bg-[#f8fafc] px-4 py-3">
                <summary className="cursor-pointer text-[13px] text-[#64748b]">Qo‘shimcha</summary>
                <div className="mt-3">
                  <Field label="API URL">
                    <input value={settings.moyskladApiUrl || ""} onChange={(event) => setSettings({ ...settings, moyskladApiUrl: event.target.value })} className="h-12 w-full rounded-[16px] border border-[#dfe8f3] bg-white px-4 text-[14px] outline-none focus:border-[#315efb]" />
                  </Field>
                </div>
              </details>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="1C URL">
                <input value={settings.oneCBaseUrl || ""} onChange={(event) => setSettings({ ...settings, oneCBaseUrl: event.target.value })} className="h-12 w-full rounded-[16px] border border-[#dfe8f3] bg-white px-4 text-[14px] outline-none focus:border-[#315efb]" placeholder="https://example.uz/onec/http/operix" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Login">
                  <input value={settings.oneCLogin || ""} onChange={(event) => setSettings({ ...settings, oneCLogin: event.target.value })} className="h-12 w-full rounded-[16px] border border-[#dfe8f3] bg-white px-4 text-[14px] outline-none focus:border-[#315efb]" />
                </Field>
                <Field label="Parol">
                  <input value={settings.oneCPassword || ""} onChange={(event) => setSettings({ ...settings, oneCPassword: event.target.value })} className="h-12 w-full rounded-[16px] border border-[#dfe8f3] bg-white px-4 text-[14px] outline-none focus:border-[#315efb]" type="password" />
                </Field>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-4 gap-2">
            <SmallButton active onClick={save} loading={loading === "save"} icon={<Save size={15} />}>Saqlash</SmallButton>
            <SmallButton onClick={() => run(currentTestPath, "test")} loading={loading === "test"}>Test</SmallButton>
            <SmallButton onClick={() => run(currentClientsPath, "clients")} loading={loading === "clients"}>Mijozlar</SmallButton>
            <SmallButton active onClick={() => run(currentAllPath, "all")} loading={loading === "all"} icon={<RefreshCcw size={15} />}>Sync all</SmallButton>
          </div>

          <div className="mt-4 rounded-[18px] bg-[#f8fafc] px-4 py-3 text-[12.5px] leading-5 text-[#64748b]">
            Sync all: mijozlar → omborlar → productlar → sklad qoldiq.
          </div>
        </div>

        <div className="mt-4 rounded-[26px] border border-[#e7edf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[20px] font-normal tracking-[-0.04em] text-[#111827]">History</h2>

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#edf2f7]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.14em] text-[#8aa0ba]">
                <tr><th className="p-3 font-normal">Sana</th><th className="p-3 font-normal">Manba</th><th className="p-3 font-normal">Amal</th><th className="p-3 font-normal">Status</th><th className="p-3 font-normal">Xabar</th></tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((item) => (
                  <tr key={item.id} className="border-t border-[#edf2f7]">
                    <td className="p-3 text-[#64748b]">{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
                    <td className="p-3 text-[#111827]">{item.source}</td>
                    <td className="p-3 text-[#64748b]">{item.type}</td>
                    <td className="p-3"><Badge status={item.status} /></td>
                    <td className="p-3 text-[#64748b]">{item.message}</td>
                  </tr>
                ))}

                {!history.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Hali sync qilinmagan</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TabCard({ title, subtitle, active, connected, onClick }: { title: string; subtitle: string; active: boolean; connected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-[22px] border px-5 py-4 text-left transition ${active ? "border-[#315efb] bg-[#eef4ff]" : "border-[#e7edf5] bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[20px] font-normal tracking-[-0.04em] text-[#111827]">{title}</p><p className="mt-1 text-[12px] text-[#8aa0ba]">{subtitle}</p></div>
        <Status active={connected} />
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#8aa0ba]">{label}</span>{children}</label>;
}

function SmallButton({ children, onClick, active, loading, icon }: { children: React.ReactNode; onClick: () => void; active?: boolean; loading?: boolean; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex h-11 items-center justify-center gap-2 rounded-[15px] px-4 text-[13px] transition disabled:opacity-60 ${active ? "bg-[#315efb] text-white shadow-[0_12px_26px_rgba(49,94,251,0.22)]" : "bg-[#f4f7fb] text-[#64748b] hover:bg-[#eef4ff] hover:text-[#315efb]"}`}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}{children}
    </button>
  );
}

function Status({ active }: { active: boolean }) {
  return <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{active ? "Ulangan" : "Yo‘q"}</div>;
}

function Badge({ status }: { status: string }) {
  const success = status === "SUCCESS";
  const failed = status === "FAILED";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] ${success ? "bg-emerald-50 text-emerald-700" : failed ? "bg-red-50 text-red-600" : "bg-[#eef4ff] text-[#315efb]"}`}>{status}</span>;
}

function Notice({ children, type }: { children: React.ReactNode; type: "success" | "error" }) {
  return <div className={`mb-4 rounded-[18px] border px-4 py-3 text-[13px] ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>{children}</div>;
}
