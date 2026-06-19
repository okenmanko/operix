"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Dashboard = {
  paymentsCount?: number;
  todayPayments?: number;
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  remainingUZS?: number;
  remainingUSD?: number;
  recentPayments?: Array<{ id: string; amount: number; currency: string; method?: string; createdAt?: string; debt?: { client?: { fullName?: string } } }>;
};

export default function FinancePage() {
  const [data, setData] = useState<Dashboard>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await apiJson<Dashboard>("/dashboard");
      setData(result || {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Moliya yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppLayout title="Moliya" subtitle="Buxgalter uchun kassa, bank, to‘lov va qarz nazorati bitta joyda.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Bugungi UZS" value={money(data.todayPaymentsUZS ?? data.todayPayments ?? 0, "UZS")} />
        <Stat label="Bugungi USD" value={money(data.todayPaymentsUSD || 0, "USD")} />
        <Stat label="Jami to‘langan UZS" value={money(data.totalPaidUZS || 0, "UZS")} />
        <Stat label="Jami to‘langan USD" value={money(data.totalPaidUSD || 0, "USD")} />
      </div>

      <div className="grid grid-cols-[.8fr_1.2fr] gap-4 max-xl:grid-cols-1">
        <section className="premium-card p-5">
          <h2 className="text-[24px] font-medium tracking-[-0.06em]">Tez amallar</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/payments" className="Action">To‘lov kiritish</Link>
            <Link href="/cashflow" className="Action">Kirim / chiqim</Link>
            <Link href="/debts" className="Action">Qarzdorlar</Link>
            <Link href="/reports" className="Action">Hisobot</Link>
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[24px] font-medium tracking-[-0.06em]">Oxirgi to‘lovlar</h2>
            <span className="qanot-pill">{num(data.paymentsCount || 0)} ta</span>
          </div>

          <div className="qanot-table-wrap overflow-hidden rounded-[18px] border border-[var(--line)]">
            <table className="qanot-table">
              <thead>
                <tr>
                  <th className="text-left">Klient</th>
                  <th className="text-left">Usul</th>
                  <th className="text-right">Summa</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentPayments || []).slice(0, 10).map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.debt?.client?.fullName || "—"}</td>
                    <td className="text-[var(--muted)]">{payment.method || "—"}</td>
                    <td className="text-right">{money(payment.amount, payment.currency || "UZS")}</td>
                  </tr>
                ))}
                {!(data.recentPayments || []).length ? (
                  <tr><td colSpan={3} className="text-center text-[var(--muted)]">To‘lovlar topilmadi.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx>{`
        .Action {
          border: 1px solid var(--line);
          background: var(--soft-card);
          border-radius: 16px;
          padding: 14px 16px;
          font-size: 14px;
          color: var(--text);
          transition: .18s ease;
        }
        .Action:hover { background: var(--hover); color: var(--blue); }
      `}</style>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-3 text-[24px] font-medium tracking-[-0.06em]">{value}</p></div>;
}
