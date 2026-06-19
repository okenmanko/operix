"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, dateText, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Dashboard = { todayPaymentsUZS?: number; todayPaymentsUSD?: number; totalPaidUZS?: number; totalPaidUSD?: number; paymentsCount?: number; remainingUZS?: number; remainingUSD?: number };
type Payment = { id: string; amount: number; currency?: string; method?: string; comment?: string; createdAt?: string; debt?: { client?: { fullName?: string; phone?: string } } };

export default function FinancePage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Dashboard>({});
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    apiJson<Dashboard>("/dashboard").then((x) => setStats(x || {})).catch(() => null);
    apiJson<Payment[]>("/payments").then((x) => setPayments(Array.isArray(x) ? x : [])).catch(() => null);
  }, []);

  const recent = useMemo(() => payments.slice(0, 8), [payments]);

  return (
    <AppLayout title={t("finance")} subtitle={t("financeSubtitle")}>
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("todayUZS")} value={money(stats.todayPaymentsUZS || 0, "UZS")} />
        <Stat label={t("todayUSD")} value={money(stats.todayPaymentsUSD || 0, "USD")} />
        <Stat label={t("totalPaidUZS")} value={money(stats.totalPaidUZS || 0, "UZS")} />
        <Stat label={t("totalPaidUSD")} value={money(stats.totalPaidUSD || 0, "USD")} />
      </div>

      <div className="mt-5 grid grid-cols-[0.9fr_1.2fr] gap-5 max-xl:grid-cols-1">
        <section className="premium-card p-6">
          <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("financeActions")}</h2>
          <div className="mt-5 grid gap-3">
            <Link className="premium-button premium-button-primary justify-start" href="/debts">{t("enterPayment")}</Link>
            <Link className="premium-button premium-button-soft justify-start" href="/cashflow">{t("incomeExpense")}</Link>
            <Link className="premium-button premium-button-soft justify-start" href="/reports">{t("dailyReport")}</Link>
          </div>

          <div className="mt-6 soft-card p-5">
            <h3 className="text-[20px] font-semibold tracking-[-0.05em]">{t("accountantChecklist")}</h3>
            <div className="mt-4 space-y-3 text-[14px] text-[var(--muted)]">
              <Check text={t("checklist1")} />
              <Check text={t("checklist2")} />
              <Check text={t("checklist3")} />
            </div>
          </div>
        </section>

        <section className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("recentPayments")}</h2>
            <span className="text-[14px] text-[var(--muted)]">{num(payments.length)} ta</span>
          </div>
          <div className="space-y-3">
            {recent.map((payment) => (
              <div key={payment.id} className="qanot-row grid grid-cols-[1fr_auto] gap-4 p-4">
                <div>
                  <p className="font-semibold">{payment.debt?.client?.fullName || payment.debt?.client?.phone || "—"}</p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">{dateText(payment.createdAt)} · {payment.method || t("cash")}</p>
                </div>
                <b className="whitespace-nowrap text-[15px] font-semibold">{money(payment.amount, payment.currency || "UZS")}</b>
              </div>
            ))}
            {!recent.length ? <div className="soft-card p-6 text-[var(--muted)]">{t("noRecentPayments")}</div> : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-4 whitespace-nowrap text-[28px] font-semibold tracking-[-0.06em]">{value}</p></div>; }
function Check({ text }: { text: string }) { return <div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-[var(--blue)]" /><span>{text}</span></div>; }
