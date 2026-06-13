"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money } from "../lib/api";

type Report = {
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  totalDebtsUZS?: number;
  totalDebtsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  remainingUZS?: number;
  remainingUSD?: number;
  dailyPayments?: { date: string; total: number; currency?: string }[];
  topDebtors?: { fullName?: string; phone?: string; total?: number; currency?: string }[];
};

const empty: Report = { dailyPayments: [], topDebtors: [] };

export default function ReportsPage() {
  const [data, setData] = useState<Report>(empty);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await apiJson<Report>("/reports");
      setData({ ...empty, ...(result || {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hisobot yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppLayout title="Hisobotlar" subtitle="Qarzlar, to‘lovlar, qoldiq va top qarzdorlar bo‘yicha yakuniy ko‘rsatkichlar.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="grid grid-cols-3 gap-5">
        <Card title="Qarz statuslari">
          <Metric label="Aktiv" value={String(data.activeDebts || 0)} />
          <Metric label="Yopilgan" value={String(data.closedDebts || 0)} />
          <Metric label="Muddati o‘tgan" value={String(data.overdueDebts || 0)} />
        </Card>

        <Card title="UZS">
          <Metric label="Jami qarz" value={money(data.totalDebtsUZS, "UZS")} />
          <Metric label="To‘langan" value={money(data.totalPaidUZS, "UZS")} />
          <Metric label="Qoldiq" value={money(data.remainingUZS, "UZS")} />
        </Card>

        <Card title="USD">
          <Metric label="Jami qarz" value={money(data.totalDebtsUSD, "USD")} />
          <Metric label="To‘langan" value={money(data.totalPaidUSD, "USD")} />
          <Metric label="Qoldiq" value={money(data.remainingUSD, "USD")} />
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <Table title="Kunlik to‘lovlar">
          {(data.dailyPayments || []).map((item, index) => (
            <tr key={`${item.date}-${index}`} className="border-t border-[#edf2f7]">
              <td className="p-4">{item.date}</td>
              <td className="p-4">{money(item.total, item.currency || "UZS")}</td>
            </tr>
          ))}
          {!(data.dailyPayments || []).length ? <Empty colSpan={2} /> : null}
        </Table>

        <Table title="Top qarzdorlar">
          {(data.topDebtors || []).map((item, index) => (
            <tr key={index} className="border-t border-[#edf2f7]">
              <td className="p-4">{item.fullName || "—"}</td>
              <td className="p-4 text-[#64748b]">{item.phone || "—"}</td>
              <td className="p-4">{money(item.total, item.currency || "UZS")}</td>
            </tr>
          ))}
          {!(data.topDebtors || []).length ? <Empty colSpan={3} /> : null}
        </Table>
      </div>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="premium-card p-6"><h2 className="text-[22px] font-normal tracking-[-0.04em]">{title}</h2><div className="mt-5 space-y-3">{children}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3 text-[14px]"><span className="text-[#64748b]">{label}</span><span>{value}</span></div>;
}

function Table({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-[22px] font-normal tracking-[-0.04em]">{title}</h2>
      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
        <table className="w-full text-left text-[14px]"><tbody>{children}</tbody></table>
      </div>
    </div>
  );
}

function Empty({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center text-[#8aa0ba]">Ma’lumot yo‘q</td></tr>;
}
