"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

const STATUS_COLORS = ["#60A5FA", "#34D399", "#F87171"];

function money(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    fetch(`http://localhost:4000/dashboard?companyId=${user?.companyId || ""}`).then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const statusData = useMemo(
    () => [
      {
        name: "Active",
        value: stats?.activeDebtsCount ?? 0,
      },
      {
        name: "Closed",
        value: stats?.closedDebtsCount ?? 0,
      },
      {
        name: "Overdue",
        value: stats?.overdueDebtsCount ?? 0,
      },
    ],
    [stats],
  );

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

      <div className="mt-5 grid grid-cols-5 gap-4">
        <div className="col-span-2">
          <ChartCard
            title="Qarz holatlari"
            subtitle="Active, closed va kechikkan qarzlar"
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: any) => [`${Number(value)} ta`, "Qarz"]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <LegendItem label="Active" value={`${stats?.activeDebtsCount ?? 0} ta`} />
              <LegendItem label="Closed" value={`${stats?.closedDebtsCount ?? 0} ta`} />
              <LegendItem label="Overdue" value={`${stats?.overdueDebtsCount ?? 0} ta`} />
            </div>
          </ChartCard>
        </div>

        <div className="col-span-3 rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-[18px] font-semibold text-slate-950">
              Top qarzdorlar
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-400">
              Valyutalar aralashtirilmasdan ko‘rsatiladi
            </p>
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
                  <p className="text-[15px] font-semibold text-sky-600">
                    {money(debt.remainingAmount)} {debt.currency}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    {debt.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
        <MiniMoney title="Qoldiq" value={remaining} currency={currency} blue />
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
  blue,
}: {
  title: string;
  value: number;
  currency: string;
  green?: boolean;
  blue?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-slate-50 p-4">
      <p className="text-[12px] font-medium text-slate-400">{title}</p>
      <p
        className={`mt-2 text-[18px] font-semibold tracking-[-0.03em] ${green ? "text-emerald-600" : blue ? "text-sky-600" : "text-slate-900"
          }`}
      >
        {money(value)} {currency}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[18px] font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-[13px] font-medium text-slate-400">
        {subtitle}
      </p>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function LegendItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[12px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}