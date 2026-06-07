"use client";

import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import StatCard from "./components/StatCard";

type TopDebtor = {
  id: string;
  amount: number;
  currency: string;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  client: {
    fullName: string;
    phone: string;
  };
};

type Stats = {
  clientsCount: number;
  debtsCount: number;
  paymentsCount: number;

  totalDebtsUZS: number;
  totalDebtsUSD: number;
  totalPaidUZS: number;
  totalPaidUSD: number;
  remainingUZS: number;
  remainingUSD: number;

  todayPaymentsUZS: number;
  todayPaymentsUSD: number;

  activeDebtsCount: number;
  closedDebtsCount: number;
  overdueDebtsCount: number;

  topDebtors: TopDebtor[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/dashboard")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Qarzdorlar, to‘lovlar va qoldiq nazorati"
    >
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Mijozlar" value={stats?.clientsCount ?? 0} />
        <StatCard title="Faol qarzlar" value={stats?.activeDebtsCount ?? 0} />
        <StatCard title="Yopilgan qarzlar" value={stats?.closedDebtsCount ?? 0} />
        <StatCard title="Kechikkanlar" value={stats?.overdueDebtsCount ?? 0} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <MoneyPanel
          title="UZS hisoboti"
          total={stats?.totalDebtsUZS ?? 0}
          paid={stats?.totalPaidUZS ?? 0}
          remaining={stats?.remainingUZS ?? 0}
          today={stats?.todayPaymentsUZS ?? 0}
          currency="UZS"
        />

        <MoneyPanel
          title="USD hisoboti"
          total={stats?.totalDebtsUSD ?? 0}
          paid={stats?.totalPaidUSD ?? 0}
          remaining={stats?.remainingUSD ?? 0}
          today={stats?.todayPaymentsUSD ?? 0}
          currency="USD"
        />
      </div>

      <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-950">
              Top qarzdorlar
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-400">
              Eng katta qoldiq bo‘yicha 5 ta mijoz
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {(stats?.topDebtors ?? []).map((debt) => (
            <div
              key={debt.id}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-slate-950">
                  {debt.client.fullName}
                </p>
                <p className="mt-1 text-[12px] font-medium text-slate-400">
                  {debt.client.phone}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[15px] font-semibold text-[#FF6B00]">
                  {debt.remainingAmount.toLocaleString("ru-RU")} {debt.currency}
                </p>
                <p className="mt-1 text-[12px] font-medium text-slate-400">
                  {debt.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function MoneyPanel({
  title,
  total,
  paid,
  remaining,
  today,
  currency,
}: {
  title: string;
  total: number;
  paid: number;
  remaining: number;
  today: number;
  currency: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[18px] font-semibold text-slate-950">{title}</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniMoney title="Jami qarz" value={total} currency={currency} />
        <MiniMoney title="To‘langan" value={paid} currency={currency} green />
        <MiniMoney title="Qoldiq" value={remaining} currency={currency} orange />
        <MiniMoney title="Bugungi tushum" value={today} currency={currency} />
      </div>
    </div>
  );
}

function MiniMoney({
  title,
  value,
  currency,
  green,
  orange,
}: {
  title: string;
  value: number;
  currency: string;
  green?: boolean;
  orange?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-slate-50 p-4">
      <p className="text-[12px] font-medium text-slate-400">{title}</p>
      <p
        className={`mt-2 text-[18px] font-semibold tracking-[-0.03em] ${
          green ? "text-emerald-600" : orange ? "text-[#FF6B00]" : "text-slate-900"
        }`}
      >
        {value.toLocaleString("ru-RU")} {currency}
      </p>
    </div>
  );
}