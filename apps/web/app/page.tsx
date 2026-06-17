"use client";

import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import { apiJson, money } from "./lib/api";
import { useI18n } from "./lib/i18n";

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
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  topDebtors?: { id?: string; fullName?: string; clientName?: string; phone?: string; total?: number; remaining?: number; currency?: string }[];
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
  todayPaymentsUZS: 0,
  todayPaymentsUSD: 0,
  activeDebts: 0,
  closedDebts: 0,
  overdueDebts: 0,
  topDebtors: [],
};

export default function DashboardPage() {
  const { t } = useI18n();
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

  useEffect(() => { load(); }, []);

  return (
    <AppLayout title={t("dashboard")} subtitle={t("dashboardSubtitle")}>
      {error ? <ErrorBox text={error} /> : null}

      <div className="grid grid-cols-4 gap-4">
        <Stat label={t("clients")} value={data.clientsCount || 0} />
        <Stat label={t("debts")} value={data.debtsCount || 0} />
        <Stat label={t("payments")} value={data.paymentsCount || 0} />
        <Stat label={t("todayPayment")} value={money(data.todayPaymentsUZS ?? data.todayPayments, "UZS")} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Panel title={t("uzsBalance")}>
          <Metric label={t("totalDebt")} value={money(data.totalDebtsUZS, "UZS")} />
          <Metric label={t("paid")} value={money(data.totalPaidUZS, "UZS")} />
          <Metric label={t("remaining")} value={money(data.remainingUZS, "UZS")} />
        </Panel>

        <Panel title={t("usdBalance")}>
          <Metric label={t("totalDebt")} value={money(data.totalDebtsUSD, "USD")} />
          <Metric label={t("paid")} value={money(data.totalPaidUSD, "USD")} />
          <Metric label={t("remaining")} value={money(data.remainingUSD, "USD")} />
        </Panel>

        <Panel title={t("debtStatuses")}>
          <Metric label={t("active")} value={String(data.activeDebts || 0)} />
          <Metric label={t("closed")} value={String(data.closedDebts || 0)} />
          <Metric label={t("overdue")} value={String(data.overdueDebts || 0)} />
        </Panel>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">{t("topDebtors")}</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--line-soft)]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[var(--soft-card)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              <tr>
                <th className="p-4 font-normal">{t("client")}</th>
                <th className="p-4 font-normal">{t("phone")}</th>
                <th className="p-4 font-normal">{t("debt")}</th>
              </tr>
            </thead>
            <tbody>
              {(data.topDebtors || []).map((item, index) => (
                <tr key={item.id || index} className="border-t border-[var(--line-soft)]">
                  <td className="p-4">{item.fullName || item.clientName || "—"}</td>
                  <td className="p-4 text-[var(--muted)]">{item.phone || "—"}</td>
                  <td className="p-4">{money(item.total ?? item.remaining, item.currency || "UZS")}</td>
                </tr>
              ))}
              {!(data.topDebtors || []).length ? (
                <tr><td colSpan={3} className="p-8 text-center text-[var(--muted-2)]">{t("noTopDebtors")}</td></tr>
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
      <p className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{label}</p>
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
    <div className="flex items-center justify-between rounded-[18px] bg-[var(--soft-card)] px-4 py-3">
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
      <span className="text-[14px] text-[var(--text)]">{value}</span>
    </div>
  );
}
