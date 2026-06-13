"use client";

import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import { apiJson, money } from "./lib/api";

type Dashboard = {
  clientsCount?: number;
  debtsCount?: number;
  paymentsCount?: number;
  totalDebtsUZS?: number;
  totalDebtsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  remainingUZS?: number;
  remainingUSD?: number;
  todayPayments?: number;
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  topDebtors?: { id?: string; fullName?: string; phone?: string; total?: number; currency?: string }[];
};

const empty: Dashboard = {
  clientsCount: 0,
  debtsCount: 0,
  paymentsCount: 0,
  totalDebtsUZS: 0,
  totalDebtsUSD: 0,
  totalPaidUZS: 0,
  totalPaidUSD: 0,
  remainingUZS: 0,
  remainingUSD: 0,
  todayPayments: 0,
  activeDebts: 0,
  closedDebts: 0,
  overdueDebts: 0,
  topDebtors: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard>(empty);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await apiJson<Dashboard>("/dashboard");
      setData({ ...empty, ...(result || {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dashboard yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Dashboard" subtitle="Operix core ko‘rsatkichlari: mijozlar, qarzlar, to‘lovlar va aktivlik.">
      {error ? <ErrorBox text={error} /> : null}

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Mijozlar" value={data.clientsCount || 0} />
        <Stat label="Qarzlar" value={data.debtsCount || 0} />
        <Stat label="To‘lovlar" value={data.paymentsCount || 0} />
        <Stat label="Bugungi to‘lov" value={money(data.todayPayments, "UZS")} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Panel title="UZS balans">
          <Metric label="Jami qarz" value={money(data.totalDebtsUZS, "UZS")} />
          <Metric label="To‘langan" value={money(data.totalPaidUZS, "UZS")} />
          <Metric label="Qoldiq" value={money(data.remainingUZS, "UZS")} />
        </Panel>

        <Panel title="USD balans">
          <Metric label="Jami qarz" value={money(data.totalDebtsUSD, "USD")} />
          <Metric label="To‘langan" value={money(data.totalPaidUSD, "USD")} />
          <Metric label="Qoldiq" value={money(data.remainingUSD, "USD")} />
        </Panel>

        <Panel title="Qarz statuslari">
          <Metric label="Aktiv" value={String(data.activeDebts || 0)} />
          <Metric label="Yopilgan" value={String(data.closedDebts || 0)} />
          <Metric label="Muddati o‘tgan" value={String(data.overdueDebts || 0)} />
        </Panel>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Top qarzdorlar</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th>
                <th className="p-4 font-normal">Telefon</th>
                <th className="p-4 font-normal">Qarz</th>
              </tr>
            </thead>
            <tbody>
              {(data.topDebtors || []).map((item, index) => (
                <tr key={item.id || index} className="border-t border-[#edf2f7]">
                  <td className="p-4">{item.fullName || "—"}</td>
                  <td className="p-4 text-[#64748b]">{item.phone || "—"}</td>
                  <td className="p-4">{money(item.total, item.currency || "UZS")}</td>
                </tr>
              ))}
              {!(data.topDebtors || []).length ? (
                <tr><td colSpan={3} className="p-8 text-center text-[#8aa0ba]">Top qarzdorlar yo‘q</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{text}</div>;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[12px] uppercase tracking-[0.12em] text-[#8aa0ba]">{label}</p>
      <p className="mt-3 text-[28px] tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-[22px] font-normal tracking-[-0.04em]">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3">
      <span className="text-[13px] text-[#64748b]">{label}</span>
      <span className="text-[14px] text-[#111827]">{value}</span>
    </div>
  );
}
