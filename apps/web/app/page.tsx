"use client";

import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import { apiJson, money } from "./lib/api";
import { useI18n } from "./lib/i18n";

type Stats = any;
export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Stats>({});
  useEffect(() => { apiJson<Stats>("/dashboard").then(setData).catch(() => setData({})); }, []);

  const debtors = data.debtorsCount || data.debtsCount || 0;
  const health = Math.max(40, Math.min(98, 100 - Math.min(40, Number(data.overdueDebts || 0) / 10)));

  return (
    <AppLayout title="Qanot" subtitle={t("dashboardSubtitle")}>
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Owner view</p><h2 className="mt-2 text-[28px] font-bold tracking-[-0.06em]">{t("ownerPanel")}</h2></div>
            <a href="/reports" className="premium-button premium-button-soft">{t("reports")}</a>
          </div>
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            <MiniStat label={t("todayIncome")} value={money(data.todayPaymentsUZS || 0, "UZS")} sub={money(data.todayPaymentsUSD || 0, "USD")} />
            <MiniStat label={t("debtRisk")} value={`${debtors}`} sub={`${data.overdueDebts || 0} ${t("overdue").toLowerCase()}`} />
            <MiniStat label={t("warehouseValue")} value={money(data.stockValueUSD || data.inventoryValueUSD || 0, "USD")} sub={`${data.productsCount || 0} ${t("productCount").toLowerCase()}`} />
            <MiniStat label={t("businessHealth")} value={`${Math.round(health)}%`} sub={health < 80 ? t("attentionNeeded") : "OK"} />
          </div>
        </div>
        <div className="premium-card p-6">
          <h2 className="text-[26px] font-bold tracking-[-0.06em]">Risk Center</h2>
          <div className="mt-5 grid gap-3 text-[14px]">
            <Risk>{data.overdueDebts || 0} {t("overdue").toLowerCase()}</Risk>
            <Risk>{money(data.remainingUSD || 0, "USD")} {t("debt").toLowerCase()}</Risk>
            <Risk>{t("sklad")} / MoySklad sync nazoratda</Risk>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        <Panel title={t("money")} rows={[[t("todayUZS"), money(data.todayPaymentsUZS || 0, "UZS")], [t("todayUSD"), money(data.todayPaymentsUSD || 0, "USD")], [t("totalPaidUZS"), money(data.totalPaidUZS || 0, "UZS")]]} />
        <Panel title={t("debts")} rows={[["UZS", money(data.remainingUZS || 0, "UZS")], ["USD", money(data.remainingUSD || 0, "USD")], [t("activeDebts"), data.activeDebts || debtors]]} />
        <Panel title={t("sklad")} rows={[[t("productCount"), data.productsCount || 0], [t("warehouseCount"), data.warehousesCount || 0], [t("stockQty"), data.stockQty || 0]]} />
      </div>
    </AppLayout>
  );
}
function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) { return <div className="soft-card p-4"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="value mt-4 text-[26px] font-bold">{value}</p>{sub ? <p className="mt-2 text-[13px] text-[var(--muted)]">{sub}</p> : null}</div>; }
function Risk({ children }: { children: any }) { return <div className="soft-card px-4 py-3 text-[var(--text)]">{children}</div>; }
function Panel({ title, rows }: { title: string; rows: any[][] }) { return <div className="premium-card p-6"><h2 className="text-[24px] font-bold tracking-[-0.05em]">{title}</h2><div className="mt-5 grid gap-3">{rows.map(([a,b])=><div key={a} className="soft-card flex items-center justify-between px-4 py-3"><span className="text-[var(--muted)]">{a}</span><b className="value">{b}</b></div>)}</div></div>; }
