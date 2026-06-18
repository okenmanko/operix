"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Search, UploadCloud } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, apiUpload, dateText, downloadFile, money, num } from "../lib/api";
import { can } from "../lib/permissions";

type Debt = {
  id: string;
  amount: number;
  currency: "UZS" | "USD";
  status: string;
  dueDate?: string | null;
  comment?: string | null;
  paidAmount?: number;
  remainingAmount?: number;
  client?: { id: string; fullName: string; phone?: string | null };
  payments?: Array<{ id: string; amount: number; currency: "UZS" | "USD" }>;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    try {
      setError("");
      const data = await apiJson<Debt[]>("/debts");
      setDebts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Qarzlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeDebts = useMemo(() => debts.filter((debt) => debt.status !== "CLOSED" && Number(debt.remainingAmount ?? debt.amount ?? 0) > 0), [debts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return activeDebts.filter((debt) => {
      const matchesQuery =
        (debt.client?.fullName || "").toLowerCase().includes(q) ||
        (debt.client?.phone || "").toLowerCase().includes(q) ||
        (debt.comment || "").toLowerCase().includes(q);
      const matchesCurrency = currency === "ALL" || debt.currency === currency;
      return matchesQuery && matchesCurrency;
    });
  }, [activeDebts, query, currency]);

  const totalUZS = activeDebts.filter((debt) => debt.currency === "UZS").reduce((sum, debt) => sum + Number(debt.remainingAmount ?? debt.amount ?? 0), 0);
  const totalUSD = activeDebts.filter((debt) => debt.currency === "USD").reduce((sum, debt) => sum + Number(debt.remainingAmount ?? debt.amount ?? 0), 0);

  async function exportExcel() {
    try {
      await downloadFile("/debts/export-excel", "operix-debts.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export xatosi");
    }
  }

  async function importExcel(file?: File | null) {
    if (!file) return;
    try {
      setImporting(true);
      setError("");
      setSuccess("");
      const form = new FormData();
      form.append("file", file);
      form.append("mode", "replace");
      const res = await apiUpload<any>("/debts/import-excel", form);
      setSuccess(res?.message || "Excel import tugadi");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import xatosi");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <AppLayout title="Qarzlar" subtitle="1C/Excel orqali qarzdorlarni import qilish, filtrlash va export.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}
      {success ? <div className="mb-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{success}</div> : null}

      <div className="premium-card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[#111827]">Qarz amallari</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qarzlar endi Excel/1C export faylidan import qilinadi. MoySklad qarziga tegmaymiz.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => importExcel(event.target.files?.[0])} />
            <button onClick={() => fileRef.current?.click()} disabled={importing} className="premium-button premium-button-primary disabled:opacity-60">
              <span className="inline-flex items-center gap-2"><UploadCloud size={17} /> {importing ? "Import..." : "Excel import"}</span>
            </button>

            {can("debts:create") ? (
              <button className="premium-button premium-button-soft"><span className="inline-flex items-center gap-2"><Plus size={17} /> Qarz qo‘shish</span></button>
            ) : null}

            <button onClick={exportExcel} className="premium-button premium-button-soft"><span className="inline-flex items-center gap-2"><Download size={17} /> Excel export</span></button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Aktiv qarzlar" value={`${num(activeDebts.length)} ta`} />
        <Stat label="UZS qoldiq" value={money(totalUZS, "UZS")} />
        <Stat label="USD qoldiq" value={money(totalUSD, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[#dfe8f3] bg-white px-4">
            <Search size={18} className="text-[#8aa0ba]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mijoz, telefon yoki izoh..." className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a6b4c7]" />
          </div>
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="premium-input">
            <option value="ALL">Hammasi</option>
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-[22px] border border-[#edf2f7]">
          <table className="w-full min-w-[780px] text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th><th className="p-4 font-normal">Qarz</th><th className="p-4 font-normal">To‘langan</th><th className="p-4 font-normal">Qoldiq</th><th className="p-4 font-normal">Muddat</th><th className="p-4 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((debt) => {
                const paid = Number(debt.paidAmount ?? (debt.payments || []).filter((p) => p.currency === debt.currency).reduce((s, p) => s + Number(p.amount || 0), 0));
                const rest = Number(debt.remainingAmount ?? Number(debt.amount || 0) - paid);
                return (
                  <tr key={debt.id} className="border-t border-[#edf2f7]">
                    <td className="p-4"><p className="text-[#111827]">{debt.client?.fullName || "—"}</p><p className="mt-1 text-[12px] text-[#8aa0ba]">{debt.client?.phone || ""}</p></td>
                    <td className="p-4 text-[#111827]">{money(debt.amount, debt.currency)}</td>
                    <td className="p-4 text-[#64748b]">{money(paid, debt.currency)}</td>
                    <td className="p-4 text-[#111827]">{money(rest, debt.currency)}</td>
                    <td className="p-4 text-[#64748b]">{debt.dueDate ? dateText(debt.dueDate) : "—"}</td>
                    <td className="p-4 text-right"><span className="rounded-full bg-[#eef4ff] px-4 py-2 text-[12px] text-[#315efb]">{debt.status || "ACTIVE"}</span></td>
                  </tr>
                );
              })}
              {!filtered.length ? <tr><td colSpan={6} className="p-10 text-center text-[#8aa0ba]">Qarz topilmadi</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-6"><p className="text-[13px] font-normal text-[#64748b]">{label}</p><p className="mt-5 text-[30px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}
