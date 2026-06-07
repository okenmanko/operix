"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method?: string;
  comment?: string;
  createdAt: string;
  debt: {
    client: {
      fullName: string;
      phone: string;
    };
  };
};

type Debt = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidAmount: number;
  remainingAmount: number;
};

function money(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(date: string) {
  const d = new Date(date);
  const now = new Date();
  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(now.getDate() - 7);
  return d >= sevenDaysAgo && d <= now;
}

function isThisMonth(date: string) {
  const d = new Date(date);
  const now = new Date();

  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isOverdue(debt: Debt) {
  if (!debt.dueDate || debt.status === "CLOSED") return false;

  const due = new Date(debt.dueDate);
  const now = new Date();

  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return due < now;
}

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:4000/payments").then((res) => res.json()),
      fetch("http://localhost:4000/debts").then((res) => res.json()),
    ])
      .then(([paymentsData, debtsData]) => {
        setPayments(paymentsData);
        setDebts(debtsData);
      })
      .catch(console.error);
  }, []);

  const report = useMemo(() => {
    const sumPayments = (
      filterFn: (payment: Payment) => boolean,
      currency: "UZS" | "USD",
    ) =>
      payments
        .filter(filterFn)
        .filter((payment) => payment.currency === currency)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const sumDebts = (
      filterFn: (debt: Debt) => boolean,
      field: "amount" | "paidAmount" | "remainingAmount",
      currency: "UZS" | "USD",
    ) =>
      debts
        .filter(filterFn)
        .filter((debt) => debt.currency === currency)
        .reduce((sum, debt) => sum + Number(debt[field]), 0);

    return {
      todayUZS: sumPayments((p) => isToday(p.createdAt), "UZS"),
      todayUSD: sumPayments((p) => isToday(p.createdAt), "USD"),

      weekUZS: sumPayments((p) => isThisWeek(p.createdAt), "UZS"),
      weekUSD: sumPayments((p) => isThisWeek(p.createdAt), "USD"),

      monthUZS: sumPayments((p) => isThisMonth(p.createdAt), "UZS"),
      monthUSD: sumPayments((p) => isThisMonth(p.createdAt), "USD"),

      totalDebtUZS: sumDebts(() => true, "amount", "UZS"),
      totalDebtUSD: sumDebts(() => true, "amount", "USD"),

      paidUZS: sumDebts(() => true, "paidAmount", "UZS"),
      paidUSD: sumDebts(() => true, "paidAmount", "USD"),

      remainingUZS: sumDebts(() => true, "remainingAmount", "UZS"),
      remainingUSD: sumDebts(() => true, "remainingAmount", "USD"),

      overdueUZS: sumDebts((d) => isOverdue(d), "remainingAmount", "UZS"),
      overdueUSD: sumDebts((d) => isOverdue(d), "remainingAmount", "USD"),

      overdueCount: debts.filter(isOverdue).length,
    };
  }, [payments, debts]);

  const latestPayments = payments.slice(0, 8);

  return (
    <AppLayout
      title="Hisobotlar"
      subtitle="Kunlik, haftalik va oylik ko‘rsatkichlar"
    >
      <div className="grid grid-cols-4 gap-4">
        <ReportCard
          title="Bugungi tushum"
          value={`${money(report.todayUZS)} UZS`}
          sub={`${money(report.todayUSD)} USD`}
        />

        <ReportCard
          title="Haftalik tushum"
          value={`${money(report.weekUZS)} UZS`}
          sub={`${money(report.weekUSD)} USD`}
        />

        <ReportCard
          title="Oylik tushum"
          value={`${money(report.monthUZS)} UZS`}
          sub={`${money(report.monthUSD)} USD`}
        />

        <ReportCard
          title="Kechikkanlar"
          value={`${report.overdueCount} ta`}
          sub={`${money(report.overdueUZS)} UZS / ${money(report.overdueUSD)} USD`}
          danger
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <CurrencyReport
          title="UZS hisoboti"
          currency="UZS"
          total={report.totalDebtUZS}
          paid={report.paidUZS}
          remaining={report.remainingUZS}
          overdue={report.overdueUZS}
        />

        <CurrencyReport
          title="USD hisoboti"
          currency="USD"
          total={report.totalDebtUSD}
          paid={report.paidUSD}
          remaining={report.remainingUSD}
          overdue={report.overdueUSD}
        />
      </div>

      <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-[18px] font-semibold text-slate-950">
            Oxirgi to‘lovlar
          </h2>
          <p className="mt-1 text-[13px] font-medium text-slate-400">
            So‘nggi kiritilgan 8 ta to‘lov
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {latestPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-slate-950">
                  {payment.debt.client.fullName}
                </p>
                <p className="mt-1 text-[12px] font-medium text-slate-400">
                  {payment.method || "-"} •{" "}
                  {new Date(payment.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </div>

              <p className="text-[15px] font-semibold text-emerald-600">
                {money(payment.amount)} {payment.currency}
              </p>
            </div>
          ))}

          {latestPayments.length === 0 && (
            <div className="py-6 text-sm font-medium text-slate-400">
              Hozircha to‘lov yo‘q
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ReportCard({
  title,
  value,
  sub,
  danger,
}: {
  title: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-slate-400">{title}</p>

      <p
        className={`mt-2 text-[24px] font-semibold tracking-[-0.04em] ${
          danger ? "text-red-500" : "text-sky-600"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[13px] font-medium text-slate-400">{sub}</p>
    </div>
  );
}

function CurrencyReport({
  title,
  currency,
  total,
  paid,
  remaining,
  overdue,
}: {
  title: string;
  currency: string;
  total: number;
  paid: number;
  remaining: number;
  overdue: number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[18px] font-semibold text-slate-950">{title}</h2>

      <div className="mt-5 space-y-3">
        <Row title="Jami qarz" value={`${money(total)} ${currency}`} />
        <Row title="To‘langan" value={`${money(paid)} ${currency}`} green />
        <Row title="Qoldiq" value={`${money(remaining)} ${currency}`} blue />
        <Row title="Kechikkan" value={`${money(overdue)} ${currency}`} danger />
      </div>
    </div>
  );
}

function Row({
  title,
  value,
  green,
  blue,
  danger,
}: {
  title: string;
  value: string;
  green?: boolean;
  blue?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-[14px] font-medium text-slate-500">{title}</span>

      <span
        className={`text-[14px] font-semibold ${
          green
            ? "text-emerald-600"
            : blue
              ? "text-sky-600"
              : danger
                ? "text-red-500"
                : "text-slate-950"
        }`}
      >
        {value}
      </span>
    </div>
  );
}