"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "./components/AppLayout";
import { apiJson, money, num } from "./lib/api";

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

type InventorySummary = {
  products?: number;
  warehouses?: number;
  totalQuantity?: number;
  totalValueUSD?: number;
  totalValueUZS?: number;
  totalValue?: number;
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
  const [data, setData] = useState<Dashboard>(empty);
  const [inventory, setInventory] = useState<InventorySummary>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [dashboard, inventorySummary] = await Promise.all([
        apiJson<Dashboard>("/dashboard"),
        apiJson<InventorySummary>("/inventory/summary").catch(() => ({})),
      ]);
      setData({ ...empty, ...(dashboard || {}) });
      setInventory(inventorySummary || {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dashboard yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const health = useMemo(() => {
    let score = 100;
    if ((data.overdueDebts || 0) > 0) score -= Math.min(18, (data.overdueDebts || 0) * 2);
    if ((data.remainingUSD || 0) > 0) score -= 5;
    if ((inventory.totalQuantity || 0) <= 0) score -= 8;
    return Math.max(55, Math.min(100, score));
  }, [data, inventory]);

  const risks = [
    data.overdueDebts ? `${data.overdueDebts} ta muddati o‘tgan qarz bor` : "Muddati o‘tgan qarz yo‘q",
    data.remainingUSD ? `${money(data.remainingUSD, "USD")} dollar qarz nazoratda` : "Dollar qarz xavfi yo‘q",
    inventory.totalQuantity ? `${num(inventory.totalQuantity)} dona tovar skladda` : "Sklad qoldig‘i sync kerak",
  ];

  return (
    <AppLayout title="Qanot" subtitle="Biznes holati: pul, qarz, sklad va xavflar bitta joyda.">
      {error ? <ErrorBox text={error} /> : null}

      <div className="mb-5 grid grid-cols-[1.25fr_.75fr] gap-4 max-xl:grid-cols-1">
        <section className="premium-card p-5">
          <div className="mb-5 flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--muted-2)]">Owner view</p>
              <h2 className="mt-2 text-[30px] font-medium tracking-[-0.07em] text-[var(--text)]">Bugungi boshqaruv paneli</h2>
            </div>
            <Link href="/reports" className="qanot-pill">Hisobotni ochish</Link>
          </div>

          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Kpi label="Bugungi tushum" value={money(data.todayPaymentsUZS ?? data.todayPayments, "UZS")} helper={money(data.todayPaymentsUSD || 0, "USD")} />
            <Kpi label="Qarzdorlar" value={num(data.debtsCount || 0)} helper={`${num(data.overdueDebts || 0)} overdue`} />
            <Kpi label="Sklad" value={money(inventory.totalValueUSD || inventory.totalValue || 0, "USD")} helper={`${num(inventory.products || 0)} product`} />
            <Kpi label="Business health" value={`${health}%`} helper={health >= 85 ? "yaxshi" : "e'tibor kerak"} />
          </div>
        </section>

        <section className="premium-card p-5">
          <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--muted-2)]">AI Director</p>
          <h2 className="mt-2 text-[24px] font-medium tracking-[-0.06em]">Bugungi maslahat</h2>
          <p className="mt-4 text-[14px] leading-6 text-[var(--muted)]">
            Qarz va skladni har kuni ertalab tekshir. Overdue qarzlar ko‘paysa, savdo o‘sishi real pulga aylanmaydi.
          </p>
          <div className="mt-5 space-y-2">
            {risks.map((risk) => (
              <div key={risk} className="rounded-[16px] bg-[var(--soft-card)] px-4 py-3 text-[13px] text-[var(--text)]">
                {risk}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        <Panel title="Pul">
          <Metric label="UZS tushum" value={money(data.todayPaymentsUZS ?? data.todayPayments, "UZS")} />
          <Metric label="USD tushum" value={money(data.todayPaymentsUSD || 0, "USD")} />
          <Metric label="To‘lovlar soni" value={num(data.paymentsCount || 0)} />
        </Panel>

        <Panel title="Qarzlar">
          <Metric label="UZS qoldiq" value={money(data.remainingUZS || 0, "UZS")} />
          <Metric label="USD qoldiq" value={money(data.remainingUSD || 0, "USD")} />
          <Metric label="Aktiv qarz" value={num(data.activeDebts || 0)} />
        </Panel>

        <Panel title="Sklad">
          <Metric label="Mahsulot turi" value={num(inventory.products || 0)} />
          <Metric label="Omborlar" value={num(inventory.warehouses || 0)} />
          <Metric label="Qoldiq dona" value={num(inventory.totalQuantity || 0)} />
        </Panel>
      </div>

      <div className="premium-card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-[24px] font-medium tracking-[-0.06em]">Top qarzdorlar</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Eng katta qoldiq bo‘yicha tez nazorat.</p>
          </div>
          <Link href="/debts" className="qanot-pill">Barchasi</Link>
        </div>
        <div className="qanot-table-wrap overflow-hidden rounded-[18px] border border-[var(--line)]">
          <table className="qanot-table">
            <thead>
              <tr>
                <th className="text-left">Klient</th>
                <th className="text-left">Telefon</th>
                <th className="text-right">Qarz</th>
              </tr>
            </thead>
            <tbody>
              {(data.topDebtors || []).slice(0, 8).map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.fullName || item.clientName || "—"}</td>
                  <td className="text-[var(--muted)]">{item.phone || "—"}</td>
                  <td className="text-right">{money(item.total ?? item.remaining, item.currency || "UZS")}</td>
                </tr>
              ))}
              {!(data.topDebtors || []).length ? (
                <tr>
                  <td colSpan={3} className="text-center text-[var(--muted)]">Qarzdorlar topilmadi.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{text}</div>;
}

function Kpi({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="qanot-kpi rounded-[20px] border border-[var(--line)] bg-[var(--soft-card)] p-4">
      <p className="text-[12px] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-[24px] font-medium tracking-[-0.06em] text-[var(--text)]">{value}</p>
      {helper ? <p className="mt-2 text-[12px] text-[var(--muted-2)]">{helper}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <h2 className="text-[22px] font-medium tracking-[-0.06em]">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-[15px] bg-[var(--soft-card)] px-4 py-3">
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
      <span className="text-[13px] font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}
