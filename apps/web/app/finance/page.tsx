"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, dateText, money } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Dashboard = { todayPaymentsUZS?: number; todayPaymentsUSD?: number; totalPaidUZS?: number; totalPaidUSD?: number; recentPayments?: any[] };

export default function FinancePage() {
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard>({});
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson<Dashboard>("/dashboard").then(setData).catch((e) => setError(e.message || "Finance yuklanmadi"));
  }, []);

  const payments = useMemo(() => Array.isArray(data.recentPayments) ? data.recentPayments : [], [data.recentPayments]);

  return (
    <AppLayout title={t("finance")} subtitle={t("financeSubtitle")}>
      {error ? <div className="mb-5 rounded-[18px] bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("todayUZS")} value={money(data.todayPaymentsUZS || 0, "UZS")} />
        <Stat label={t("todayUSD")} value={money(data.todayPaymentsUSD || 0, "USD")} />
        <Stat label={t("totalPaidUZS")} value={money(data.totalPaidUZS || 0, "UZS")} />
        <Stat label={t("totalPaidUSD")} value={money(data.totalPaidUSD || 0, "USD")} />
      </div>

      <div className="grid grid-cols-[0.8fr_1.2fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("financeActions")}</h2>
          <div className="mt-5 grid gap-3">
            <a href="/debts" className="premium-button premium-button-primary justify-start">{t("enterPayment")}</a>
            <a href="/payments" className="premium-button premium-button-soft justify-start">{t("recentPayments")}</a>
            <a href="/reports" className="premium-button premium-button-soft justify-start">{t("dailyReport")}</a>
          </div>
          <div className="mt-6 soft-card p-4">
            <h3 className="font-bold">{t("accountantChecklist")}</h3>
            <ul className="mt-3 space-y-2 text-[14px] text-[var(--muted)]">
              <li>• {t("checklist1")}</li>
              <li>• {t("checklist2")}</li>
              <li>• {t("checklist3")}</li>
            </ul>
          </div>
        </div>

        <div className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("recentPayments")}</h2>
            <span className="badge">{payments.length}</span>
          </div>
          <div className="table-wrap qanot-scroll">
            <table className="premium-table min-w-[720px]">
              <thead><tr><th>{t("client")}</th><th>{t("method")}</th><th className="cell-num">{t("amount")}</th><th>{t("today")}</th></tr></thead>
              <tbody>
                {payments.map((p, i) => <tr key={p.id || i}><td>{p.debt?.client?.fullName || p.clientName || "—"}</td><td className="muted">{p.method || "—"}</td><td className="cell-num font-semibold">{money(p.amount || 0, p.currency || "UZS")}</td><td className="muted">{dateText(p.createdAt)}</td></tr>)}
                {!payments.length ? <tr><td colSpan={4} className="p-10 text-center text-[var(--muted)]">{t("noRecentPayments")}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="value mt-4 text-[28px] font-bold">{value}</p></div>; }
