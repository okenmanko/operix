"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CreditCard,
  LineChart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
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
      const [dash, inv] = await Promise.allSettled([
        apiJson<Dashboard>("/dashboard"),
        apiJson<InventorySummary>("/inventory/summary"),
      ]);

      if (dash.status === "fulfilled") setData({ ...empty, ...(dash.value || {}) });
      if (inv.status === "fulfilled") setInventory(inv.value || {});
      if (dash.status === "rejected") throw dash.reason;
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
    const debtPenalty = Math.min(28, overdue * 2.5);
    const stockPenalty = stock <= 0 ? 16 : 0;
    return Math.max(52, Math.round(96 - debtPenalty - stockPenalty));
  }, [data, inventory]);

  const risks = [
    Number(data.overdueDebts || 0) > 0
      ? `${num(data.overdueDebts || 0)} ta muddati o‘tgan qarz bor`
      : "Muddati o‘tgan qarz nazoratda",
    Number(inventory.totalQuantity || 0) <= 0
      ? "Sklad qoldiqlarini sync qilish kerak"
      : `${num(inventory.totalQuantity || 0)} dona tovar nazoratda`,
    Number(data.remainingUSD || 0) > 0
      ? `USD qarz qoldig‘i: ${money(data.remainingUSD, "USD")}`
      : "USD qarz yo‘q yoki yopilgan",
  ];

  return (
    <AppLayout
      title="Qanot Dashboard"
      subtitle="Biznes egasi va buxgalter uchun bitta aniq boshqaruv ekrani."
    >
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}

      <div className="grid grid-cols-[1.25fr_.75fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Business Health™</p>
              <h2 className="mt-2 text-[42px] font-normal tracking-[-0.07em] text-[var(--text)]">
                {health}/100
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
                Qanot pul, qarz va sklad holatidan kelib chiqib biznes sog‘lig‘ini bitta raqamga jamlaydi.
              </p>
            </div>
            <div className="rounded-[26px] bg-[var(--blue-soft)] px-5 py-4 text-[var(--blue)]">
              <Sparkles size={28} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Kpi icon={Wallet} label="Bugungi kirim" value={money(data.todayPaymentsUSD || 0, "USD")} hint={money(data.todayPaymentsUZS || data.todayPayments || 0, "UZS")} />
            <Kpi icon={Users} label="Qarzdorlar" value={`${num(data.debtsCount || 0)} ta`} hint={`${num(data.overdueDebts || 0)} ta overdue`} />
            <Kpi icon={Box} label="Sklad" value={`${num(inventory.products || 0)} SKU`} hint={`${num(inventory.totalQuantity || 0)} dona`} />
            <Kpi icon={LineChart} label="Sklad qiymati" value={money(inventory.totalValueUSD || inventory.totalValue || 0, "USD")} hint="MoySklad qoldiq" />
          </div>
        </div>

        <div className="premium-card p-6">
          <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Risk Center™</p>
          <div className="mt-4 space-y-3">
            {risks.map((risk, index) => (
              <div key={risk} className="flex gap-3 rounded-[18px] bg-[var(--card-2)] px-4 py-3">
                <AlertTriangle className={index === 0 && Number(data.overdueDebts || 0) > 0 ? "text-amber-500" : "text-[var(--blue)]"} size={18} />
                <p className="text-[13px] leading-5 text-[var(--text)]">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        <Workspace
          title="Buxgalter Workspace"
          text="Excel qarzlar, kirim-chiqim, to‘lovlar va kassa nazorati."
          href="/finance"
          items={["Kirim / chiqim", "To‘lov tarixi", "Excel qarz import", "CSV / Excel export"]}
        />
        <Workspace
          title="Owner Workspace"
          text="Egaga kerak bo‘lgan aniq raqamlar: foyda, qarz, sklad, xavf."
          href="/reports"
          items={["Business Health", "Risk Center", "Top qarzdorlar", "Trendlar"]}
        />
        <Workspace
          title="Sklad Workspace"
          text="MoySklad qoldiq, tannarx, sotuv narxi va sklad bo‘yicha taqsimot."
          href="/sklad"
          items={["Mahsulotlar", "Omborlar", "Qoldiq", "QR / harakatlar"]}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Balance title="Qarzlar UZS" total={data.totalDebtsUZS || 0} paid={data.totalPaidUZS || 0} remaining={data.remainingUZS || 0} currency="UZS" />
        <Balance title="Qarzlar USD" total={data.totalDebtsUSD || 0} paid={data.totalPaidUSD || 0} remaining={data.remainingUSD || 0} currency="USD" />
      </div>

      <div className="premium-card mt-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--muted-2)]">AI Director™</p>
            <h2 className="mt-2 text-[25px] font-normal tracking-[-0.05em]">Bugungi tavsiya</h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--muted)]">
              Qarzlar manbaini Excel/1C orqali, skladni MoySklad orqali ajrating. Shunda buxgalteriya va ombor hisoblari aralashmaydi.
            </p>
          </div>
          <Link href="/reports" className="hidden h-11 items-center gap-2 rounded-[16px] bg-[#315efb] px-5 text-[13px] text-white max-md:hidden md:inline-flex">
            Hisobot <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-4">
      <Icon size={18} className="text-[var(--blue)]" />
      <p className="mt-4 text-[12px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[22px] font-normal tracking-[-0.05em] text-[var(--text)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--muted-2)]">{hint}</p>
    </div>
  );
}

function Workspace({ title, text, href, items }: { title: string; text: string; href: string; items: string[] }) {
  return (
    <Link href={href} className="premium-card block p-6 transition hover:-translate-y-0.5 hover:border-[var(--blue)]/35">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-normal tracking-[-0.05em]">{title}</h2>
          <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{text}</p>
        </div>
        <ArrowRight size={19} className="mt-1 text-[var(--muted-2)]" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--card-2)] px-3 py-1.5 text-[12px] text-[var(--muted)]">
            {item}
          </span>
        ))}
      </div>
    </Link>
  );
}

function Balance({ title, total, paid, remaining, currency }: { title: string; total: number; paid: number; remaining: number; currency: string }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-[22px] font-normal tracking-[-0.05em]">{title}</h2>
      <div className="mt-5 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <Mini label="Jami" value={money(total, currency)} />
        <Mini label="To‘langan" value={money(paid, currency)} />
        <Mini label="Qoldiq" value={money(remaining, currency)} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--card-2)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 text-[15px] text-[var(--text)]">{value}</p>
    </div>
  );
}
