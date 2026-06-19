"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import { apiJson, money, num } from "./lib/api";
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
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  todayPayments?: number;
  overdueDebts?: number;
  activeDebts?: number;
  topDebtors?: Array<{ fullName?: string; clientName?: string; phone?: string; remaining?: number; total?: number; currency?: string }>;
};

type InventorySummary = {
  productsCount?: number;
  warehousesCount?: number;
  totalQuantity?: number;
  totalValue?: number;
  totalSaleValueUSD?: number;
};

const emptyDashboard: Dashboard = { clientsCount: 0, debtsCount: 0, paymentsCount: 0, remainingUZS: 0, remainingUSD: 0, todayPaymentsUZS: 0, todayPaymentsUSD: 0, overdueDebts: 0, activeDebts: 0, topDebtors: [] };
const emptyStock: InventorySummary = { productsCount: 0, warehousesCount: 0, totalQuantity: 0, totalValue: 0, totalSaleValueUSD: 0 };

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard>(emptyDashboard);
  const [stock, setStock] = useState<InventorySummary>(emptyStock);

  useEffect(() => {
    apiJson<Dashboard>("/dashboard").then((x) => setData({ ...emptyDashboard, ...(x || {}) })).catch(() => null);
    apiJson<InventorySummary>("/inventory/summary").then((x) => setStock({ ...emptyStock, ...(x || {}) })).catch(() => null);
  }, []);

  const overdue = Number(data.overdueDebts || 0);
  const active = Number(data.activeDebts || data.debtsCount || 0);
  const health = Math.max(45, Math.min(98, 100 - Math.round(overdue / Math.max(active, 1) * 35)));
  const stockValue = Number(stock.totalSaleValueUSD || stock.totalValue || 0);

  return (
    <AppLayout title="Qanot" subtitle={t("dashboardSubtitle")}>
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("todayIncome")} value={money(data.todayPaymentsUZS || data.todayPayments || 0, "UZS")} sub={money(data.todayPaymentsUSD || 0, "USD")} />
        <Stat label={t("debtRisk")} value={`${num(active)} ${t("activeDebts")}`} sub={`${num(overdue)} ${t("overdue")}`} />
        <Stat label={t("warehouseValue")} value={money(stockValue, "USD")} sub={`${num(stock.productsCount)} ${t("products")}`} />
        <Stat label={t("businessHealth")} value={`${health}%`} sub={health < 75 ? t("attentionNeeded") : "OK"} />
      </div>

      <div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-5 max-xl:grid-cols-1">
        <section className="premium-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="premium-label">OWNER VIEW</p>
              <h2 className="text-[27px] font-semibold tracking-[-0.06em]">{t("ownerPanel")}</h2>
              <p className="mt-2 text-[14px] text-[var(--muted)]">{t("ownerPanelSub")}</p>
            </div>
            <Link href="/reports" className="premium-button premium-button-soft">{t("reports")}</Link>
          </div>

          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
            <MiniPanel title={t("money")} rows={[["UZS", money(data.todayPaymentsUZS || 0, "UZS")], ["USD", money(data.todayPaymentsUSD || 0, "USD")], [t("payments"), num(data.paymentsCount || 0)]]} />
            <MiniPanel title={t("debts")} rows={[["UZS", money(data.remainingUZS || 0, "UZS")], ["USD", money(data.remainingUSD || 0, "USD")], [t("overdue"), num(overdue)]]} />
            <MiniPanel title={t("sklad")} rows={[[t("products"), num(stock.productsCount || 0)], [t("warehouseCount"), num(stock.warehousesCount || 0)], [t("stockQty"), num(stock.totalQuantity || 0)]]} />
          </div>
        </section>

        <section className="premium-card p-6">
          <p className="premium-label">RISK CENTER</p>
          <h2 className="text-[27px] font-semibold tracking-[-0.06em]">{t("attentionNeeded")}</h2>
          <div className="mt-5 space-y-3">
            <Risk text={`${num(overdue)} ${t("overdue")}`} />
            <Risk text={`${money(data.remainingUSD || 0, "USD")} ${t("debt")}`} />
            <Risk text={`${num(stock.totalQuantity || 0)} ${t("stockQty")}`} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-4 whitespace-nowrap text-[28px] font-semibold tracking-[-0.06em]">{value}</p>{sub ? <p className="mt-2 text-[13px] text-[var(--muted-2)]">{sub}</p> : null}</div>;
}
function MiniPanel({ title, rows }: { title: string; rows: string[][] }) {
  return <div className="soft-card p-4"><h3 className="mb-4 text-[18px] font-semibold tracking-[-0.04em]">{title}</h3><div className="space-y-2">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between rounded-[15px] bg-[var(--card)] px-3 py-2 text-[13px]"><span className="text-[var(--muted)]">{k}</span><b className="font-semibold">{v}</b></div>)}</div></div>;
}
function Risk({ text }: { text: string }) { return <div className="rounded-[18px] bg-[var(--soft-card)] px-4 py-3 text-[14px] text-[var(--text)]">{text}</div>; }
