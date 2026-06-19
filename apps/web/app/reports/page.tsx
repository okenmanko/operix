"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Stats = any;
export default function ReportsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Stats>({});
  useEffect(() => { apiJson<Stats>("/dashboard").then(setData).catch(() => setData({})); }, []);
  const top = Array.isArray(data.topDebtors) ? data.topDebtors.slice(0, 10) : [];
  return (
    <AppLayout title={t("reports")} subtitle={t("reportsSubtitle")}>
      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("activeDebts")} value={`${data.activeDebts || data.debtsCount || 0}`} />
        <Stat label={t("overdue")} value={`${data.overdueDebts || 0}`} />
        <Stat label="UZS" value={money(data.remainingUZS || totalByCurrency(top, "UZS"), "UZS")} />
        <Stat label="USD" value={money(data.remainingUSD || totalByCurrency(top, "USD"), "USD")} />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6"><h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("debtStatuses")}</h2><div className="mt-5 grid gap-3"><Row label={t("opened")} value={data.activeDebts || 0} /><Row label={t("overdue")} value={data.overdueDebts || 0} /><Row label={t("closed")} value={data.closedDebts || 0} /></div></div>
        <div className="premium-card p-6"><h2 className="text-[24px] font-bold tracking-[-0.05em]">{t("topDebtors")}</h2><div className="mt-5 table-wrap qanot-scroll"><table className="premium-table"><thead><tr><th>{t("client")}</th><th>{t("phone")}</th><th className="cell-num">{t("debt")}</th></tr></thead><tbody>{top.map((x:any, i:number)=><tr key={x.id || i}><td>{x.fullName || x.clientName || "—"}</td><td className="muted">{x.phone || "—"}</td><td className="cell-num font-semibold">{money(x.remaining || x.total || 0, x.currency || "UZS")}</td></tr>)}{!top.length?<tr><td colSpan={3} className="p-10 text-center text-[var(--muted)]">Ma’lumot yo‘q</td></tr>:null}</tbody></table></div></div>
      </div>
    </AppLayout>
  );
}
function totalByCurrency(rows:any[], currency:string){return rows.filter(x=>(x.currency||"UZS")===currency).reduce((s,x)=>s+Number(x.remaining||x.total||0),0)}
function Stat({ label, value }: { label: string; value: string }) { return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="value mt-4 text-[28px] font-bold">{value}</p></div>; }
function Row({ label, value }: { label: string; value: any }) { return <div className="soft-card flex items-center justify-between px-4 py-3"><span className="text-[var(--muted)]">{label}</span><b>{value}</b></div>; }
