"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { Toast } from "../components/ui/Toast";
import { apiJson, money, dateText } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Report = {
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  statuses?: { active?: number; closed?: number; overdue?: number };
  totalDebtsUZS?: number;
  totalDebtsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  remainingUZS?: number;
  remainingUSD?: number;
  uzs?: { totalDebt?: number; paid?: number; remaining?: number };
  usd?: { totalDebt?: number; paid?: number; remaining?: number };
  dailyPayments?: { date?: string; createdAt?: string; total?: number; amount?: number; currency?: string; clientName?: string }[];
  topDebtors?: { fullName?: string; clientName?: string; phone?: string; total?: number; remaining?: number; currency?: string }[];
};

const empty: Report = { dailyPayments: [], topDebtors: [] };

export default function ReportsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Report>(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const result = await apiJson<Report>("/reports");
      setData({ ...empty, ...(result || {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hisobot yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const normalized = useMemo(() => {
    const statuses = {
      active: data.activeDebts ?? data.statuses?.active ?? 0,
      closed: data.closedDebts ?? data.statuses?.closed ?? 0,
      overdue: data.overdueDebts ?? data.statuses?.overdue ?? 0,
    };
    const uzs = {
      totalDebt: data.totalDebtsUZS ?? data.uzs?.totalDebt ?? 0,
      paid: data.totalPaidUZS ?? data.uzs?.paid ?? 0,
      remaining: data.remainingUZS ?? data.uzs?.remaining ?? 0,
    };
    const usd = {
      totalDebt: data.totalDebtsUSD ?? data.usd?.totalDebt ?? 0,
      paid: data.totalPaidUSD ?? data.usd?.paid ?? 0,
      remaining: data.remainingUSD ?? data.usd?.remaining ?? 0,
    };
    return { statuses, uzs, usd };
  }, [data]);

  function exportCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Active debts", normalized.statuses.active],
      ["Closed debts", normalized.statuses.closed],
      ["Overdue debts", normalized.statuses.overdue],
      ["UZS total", normalized.uzs.totalDebt],
      ["UZS paid", normalized.uzs.paid],
      ["UZS remaining", normalized.uzs.remaining],
      ["USD total", normalized.usd.totalDebt],
      ["USD paid", normalized.usd.paid],
      ["USD remaining", normalized.usd.remaining],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operix-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout title={t("reports")} subtitle={t("reportsSubtitle")}>
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="mb-5 flex flex-wrap justify-end gap-3">
        <button onClick={load} className="premium-button premium-button-soft"><RefreshCw size={17} /> {t("refresh")}</button>
        <button onClick={exportCsv} className="premium-button premium-button-primary"><Download size={17} /> CSV</button>
      </div>

      {loading ? <div className="premium-card p-8 text-[var(--muted)]">{t("loading")}</div> : null}

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Card title={t("debtStatuses")}>
          <Metric label={t("active")} value={String(normalized.statuses.active)} />
          <Metric label={t("closed")} value={String(normalized.statuses.closed)} />
          <Metric label={t("overdue")} value={String(normalized.statuses.overdue)} />
        </Card>

        <Card title="UZS">
          <Metric label={t("totalDebt")} value={money(normalized.uzs.totalDebt, "UZS")} />
          <Metric label={t("paid")} value={money(normalized.uzs.paid, "UZS")} />
          <Metric label={t("remaining")} value={money(normalized.uzs.remaining, "UZS")} />
        </Card>

        <Card title="USD">
          <Metric label={t("totalDebt")} value={money(normalized.usd.totalDebt, "USD")} />
          <Metric label={t("paid")} value={money(normalized.usd.paid, "USD")} />
          <Metric label={t("remaining")} value={money(normalized.usd.remaining, "USD")} />
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Table title={t("dailyPayments")} headers={[t("date"), t("client"), t("amount")]}> 
          {(data.dailyPayments || []).map((item, index) => (
            <tr key={`${item.date || item.createdAt}-${index}`} className="border-t border-[var(--line-soft)]">
              <td className="p-4 text-[var(--muted)]">{item.date || dateText(item.createdAt)}</td>
              <td className="p-4 text-[var(--text)]">{item.clientName || "—"}</td>
              <td className="p-4 text-[var(--text)]">{money(item.total ?? item.amount, item.currency || "UZS")}</td>
            </tr>
          ))}
          {!(data.dailyPayments || []).length ? <Empty colSpan={3} /> : null}
        </Table>

        <Table title={t("topDebtors")} headers={[t("client"), t("phone"), t("debt")]}> 
          {(data.topDebtors || []).map((item, index) => (
            <tr key={index} className="border-t border-[var(--line-soft)]">
              <td className="p-4 text-[var(--text)]">{item.fullName || item.clientName || "—"}</td>
              <td className="p-4 text-[var(--muted)]">{item.phone || "—"}</td>
              <td className="p-4 text-[var(--text)]">{money(item.total ?? item.remaining, item.currency || "UZS")}</td>
            </tr>
          ))}
          {!(data.topDebtors || []).length ? <Empty colSpan={3} /> : null}
        </Table>
      </div>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="premium-card p-6"><h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">{title}</h2><div className="mt-5 space-y-3">{children}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-[18px] bg-[var(--card-2)] px-4 py-3 text-[14px]"><span className="text-[var(--muted)]">{label}</span><span className="text-[var(--text)]">{value}</span></div>;
}

function Table({ title, headers, children }: { title: string; headers: string[]; children: React.ReactNode }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">{title}</h2>
      <div className="mt-5 overflow-auto rounded-[22px] border border-[var(--line-soft)] operix-scrollbar">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[var(--card-2)] text-[11px] uppercase tracking-[0.14em] text-[var(--muted-2)]">
            <tr>{headers.map((header) => <th key={header} className="p-4 font-normal">{header}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function Empty({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center text-[var(--muted-2)]">Ma’lumot yo‘q</td></tr>;
}
