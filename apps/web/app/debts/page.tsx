"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ClientsExcelTools from "../components/ClientsExcelTools";
import { apiJson, dateText, money, num } from "../lib/api";
import { can } from "../lib/permissions";

type Debt = {
  id: string;
  amount: number;
  currency: "UZS" | "USD";
  status: string;
  dueDate?: string | null;
  comment?: string | null;
  client?: {
    id: string;
    fullName: string;
    phone?: string | null;
  };
  payments?: Array<{
    id: string;
    amount: number;
    currency: "UZS" | "USD";
  }>;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState("ALL");
  const [error, setError] = useState("");

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

  const activeDebts = useMemo(() => {
    return debts.filter((debt) => debt.status !== "CLOSED" && Number(debt.amount || 0) > 0);
  }, [debts]);

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

  const totalUZS = activeDebts
    .filter((debt) => debt.currency === "UZS")
    .reduce((sum, debt) => sum + Number(debt.amount || 0), 0);

  const totalUSD = activeDebts
    .filter((debt) => debt.currency === "USD")
    .reduce((sum, debt) => sum + Number(debt.amount || 0), 0);

  async function exportExcel() {
    try {
      await downloadFileSafe("/debts/export-excel", "QARZ13-operix-export.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export xatosi");
    }
  }

  return (
    <AppLayout title="Qarzlar" subtitle="1C/Excel qarzdorlar. Excel import Operix qarzlari uchun yagona manba.">
      {error ? (
        <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="premium-card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[#111827]">Qarz amallari</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qarzlar endi Excel/1C export faylidan import qilinadi. MoySklad qarziga tegmaymiz.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {can("debts:create") ? (
              <button className="premium-button premium-button-primary">
                <span className="inline-flex items-center gap-2">
                  <Plus size={17} /> Qarz qo‘shish
                </span>
              </button>
            ) : null}

            {can("clients:export") ? (
              <button onClick={exportExcel} className="premium-button premium-button-soft">
                <span className="inline-flex items-center gap-2">
                  <Download size={17} /> Excel export
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ClientsExcelTools onDone={load} />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat label="Aktiv qarzlar" value={`${num(activeDebts.length)} ta`} />
        <Stat label="UZS qoldiq" value={money(totalUZS, "UZS")} />
        <Stat label="USD qoldiq" value={money(totalUSD, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[1fr_260px] gap-4">
          <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[#dfe8f3] bg-white px-4">
            <Search size={18} className="text-[#8aa0ba]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mijoz, telefon yoki izoh..."
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a6b4c7]"
            />
          </div>

          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="premium-input"
          >
            <option value="ALL">Hammasi</option>
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th>
                <th className="p-4 font-normal">Qarz</th>
                <th className="p-4 font-normal">To‘langan</th>
                <th className="p-4 font-normal">Qoldiq</th>
                <th className="p-4 font-normal">Muddat</th>
                <th className="p-4 text-right font-normal">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((debt) => {
                const paid = (debt.payments || [])
                  .filter((payment) => payment.currency === debt.currency)
                  .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

                const rest = Number(debt.amount || 0) - paid;

                return (
                  <tr key={debt.id} className="border-t border-[#edf2f7]">
                    <td className="p-4">
                      <p className="text-[#111827]">{debt.client?.fullName || "—"}</p>
                      <p className="mt-1 text-[12px] text-[#8aa0ba]">{debt.client?.phone || ""}</p>
                    </td>
                    <td className="p-4 text-[#111827]">{money(debt.amount, debt.currency)}</td>
                    <td className="p-4 text-[#64748b]">{money(paid, debt.currency)}</td>
                    <td className="p-4 text-[#111827]">{money(rest, debt.currency)}</td>
                    <td className="p-4 text-[#64748b]">{debt.dueDate ? dateText(debt.dueDate) : "—"}</td>
                    <td className="p-4 text-right">
                      <span className="rounded-full bg-[#eef4ff] px-4 py-2 text-[12px] text-[#315efb]">
                        {debt.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#8aa0ba]">
                    Qarz topilmadi
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[13px] font-normal text-[#64748b]">{label}</p>
      <p className="mt-5 text-[30px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p>
    </div>
  );
}

async function downloadFileSafe(path: string, filename: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${base}${path}`, { credentials: "include" });

  if (!response.ok) throw new Error("Fayl yuklanmadi");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
