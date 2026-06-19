"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  todayPayments?: number;
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  topDebtors?: Array<{
    id?: string;
    fullName?: string;
    clientName?: string;
    phone?: string;
    total?: number;
    remaining?: number;
    currency?: string;
  }>;
};

type InventorySummary = {
  products?: number;
  warehouses?: number;
  totalQuantity?: number;
  totalValueUSD?: number;
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
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard>(empty);
  const [inventory, setInventory] = useState<InventorySummary>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [dashboard, stock] = await Promise.allSettled([
        apiJson<Dashboard>("/dashboard"),
        apiJson<InventorySummary>("/inventory/summary"),
      ]);

      if (dashboard.status === "fulfilled") {
        setData({ ...empty, ...(dashboard.value || {}) });
      } else {
        throw dashboard.reason;
      }

      if (stock.status === "fulfilled") setInventory(stock.value || {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dashboard yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const health = useMemo(() => {
    const overdue = Number(data.overdueDebts || 0);
    const active = Number(data.activeDebts || data.debtsCount || 0);
    const stock = Number(inventory.totalQuantity || 0);
    let score = 92;

    if (active > 0) score -= Math.min(22, Math.round((overdue / active) * 42));
    if (stock <= 0) score -= 10;

    return Math.max(45, Math.min(99, score));
  }, [data, inventory]);

  const todayUZS = Number(data.todayPaymentsUZS ?? data.todayPayments ?? 0);
  const todayUSD = Number(data.todayPaymentsUSD ?? 0);
  const overdue = Number(data.overdueDebts || 0);
  const stockValue = Number(inventory.totalValueUSD || inventory.totalValue || 0);

  return (
    <AppLayout title="Qanot" subtitle="Pul, qarz va sklad bitta tartibli ekranda.">
      {error ? <ErrorBox text={error} /> : null}

      <section className="qanot-card p-6">
        <div className="mb-6 flex items-start justify-between gap-4 max-md:flex-col">
          <div>
            <p className="qanot-eyebrow">Owner view</p>
            <h2 className="qanot-title mt-2">Bugungi boshqaruv paneli</h2>
            <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">
              Egaga kerak bo‘lgan asosiy raqamlar: pul, qarz, sklad va xavf.
            </p>
          </div>
          <Link href="/reports" className="qanot-small-button">
            {t("openReport", "Hisobot")}
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
          <FocusCard label="Bugungi tushum" value={money(todayUZS, "UZS")} hint={money(todayUSD, "USD")} />
          <FocusCard label="Qarz riski" value={num(data.debtsCount || data.activeDebts || 0)} hint={`${num(overdue)} muddati o‘tgan`} />
          <FocusCard label="Sklad qiymati" value={money(stockValue, "USD")} hint={`${num(inventory.products || 0)} mahsulot`} />
          <FocusCard label="Business health" value={`${health}%`} hint={health < 80 ? "E’tibor kerak" : "Barqaror"} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        <MiniPanel title="Pul">
          <Metric label="UZS tushum" value={money(todayUZS, "UZS")} />
          <Metric label="USD tushum" value={money(todayUSD, "USD")} />
          <Metric label="To‘lovlar soni" value={num(data.paymentsCount || 0)} />
        </MiniPanel>

        <MiniPanel title="Qarzlar">
          <Metric label="UZS qoldiq" value={money(data.remainingUZS || 0, "UZS")} />
          <Metric label="USD qoldiq" value={money(data.remainingUSD || 0, "USD")} />
          <Metric label="Aktiv qarz" value={num(data.activeDebts || data.debtsCount || 0)} />
        </MiniPanel>

        <MiniPanel title="Sklad">
          <Metric label="Mahsulot turi" value={num(inventory.products || 0)} />
          <Metric label="Omborlar" value={num(inventory.warehouses || 0)} />
          <Metric label="Qoldiq dona" value={num(inventory.totalQuantity || 0)} />
        </MiniPanel>
      </div>

      <section className="qanot-card mt-5 p-6">
        <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.04em] text-[var(--text)]">
              Nazorat signallari
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
              Kunlik tekshiruv uchun eng muhim xavflar.
            </p>
          </div>
          <Link href="/debts" className="qanot-small-button">
            Qarzdorlarni ochish
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          <Signal label="Muddati o‘tgan qarz" value={`${num(overdue)} ta`} tone={overdue > 0 ? "warning" : "good"} />
          <Signal label="USD qarz" value={money(data.remainingUSD || 0, "USD")} tone={Number(data.remainingUSD || 0) > 0 ? "warning" : "good"} />
          <Signal label="Sklad qoldiq" value={`${num(inventory.totalQuantity || 0)} dona`} tone={Number(inventory.totalQuantity || 0) > 0 ? "good" : "warning"} />
        </div>
      </section>
    </AppLayout>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{text}</div>;
}

function FocusCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--card-2)] p-4">
      <p className="text-[12px] leading-5 text-[var(--muted)]">{label}</p>
      <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.025em] text-[var(--text)]">
        {value}
      </p>
      <p className="mt-3 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-5 text-[var(--muted-2)]">
        {hint}
      </p>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="qanot-card p-5">
      <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[var(--text)]">
        {title}
      </h2>
      <div className="mt-5 space-y-2">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 rounded-[16px] bg-[var(--card-2)] px-4 py-2.5">
      <span className="text-[13px] leading-5 text-[var(--muted)]">{label}</span>
      <span className="whitespace-nowrap text-[13px] font-semibold leading-5 tracking-normal text-[var(--text)]">{value}</span>
    </div>
  );
}

function Signal({ label, value, tone }: { label: string; value: string; tone: "good" | "warning" }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--card-2)] p-4">
      <p className="text-[12px] leading-5 text-[var(--muted)]">{label}</p>
      <p className={`mt-2 whitespace-nowrap text-[20px] font-semibold tracking-[-0.02em] ${tone === "good" ? "text-emerald-600" : "text-amber-600"}`}>
        {value}
      </p>
    </div>
  );
}
