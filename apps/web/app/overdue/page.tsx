"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../components/AppLayout";

type Debt = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  comment?: string;
  dueDate?: string;
  paidAmount: number;
  remainingAmount: number;
  client: {
    id: string;
    fullName: string;
    phone: string;
  };
};

function money(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function getOverdueDays(date?: string) {
  if (!date) return 0;

  const due = new Date(date);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function isOverdue(debt: Debt) {
  if (!debt.dueDate || debt.status === "CLOSED") return false;

  const due = new Date(debt.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today && Number(debt.remainingAmount) > 0;
}

export default function OverduePage() {
  const router = useRouter();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    const res = await fetch(
      `http://localhost:4000/debts?companyId=${user?.companyId || ""}`,
    );

    const data = await res.json();
    setDebts(data);
  }

  const overdueDebts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return debts
      .filter(isOverdue)
      .filter((debt) => {
        if (!q) return true;

        return (
          debt.client.fullName.toLowerCase().includes(q) ||
          debt.client.phone.toLowerCase().includes(q) ||
          (debt.comment || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => getOverdueDays(b.dueDate) - getOverdueDays(a.dueDate));
  }, [debts, search]);

  const overdueUZS = overdueDebts
    .filter((debt) => debt.currency === "UZS")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  const overdueUSD = overdueDebts
    .filter((debt) => debt.currency === "USD")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  return (
    <AppLayout title="Kechikkanlar" subtitle="Muddati o‘tgan qarzlar nazorati">
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard title="Kechikkan qarzlar" value={`${overdueDebts.length} ta`} />
        <SummaryCard title="UZS qoldiq" value={`${money(overdueUZS)} UZS`} blue />
        <SummaryCard title="USD qoldiq" value={`${money(overdueUSD)} USD`} green />
      </div>

      <div className="mt-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mijoz, telefon yoki izoh..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-sky-400"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[18px] font-semibold text-slate-950">
            Kechikkan qarzlar
          </h2>

          <p className="mt-1 text-[13px] font-medium text-slate-400">
            Eng ko‘p kechikkanlar tepada chiqadi
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {overdueDebts.map((debt) => {
            const days = getOverdueDays(debt.dueDate);

            return (
              <button
                key={debt.id}
                type="button"
                onClick={() => router.push(`/clients/${debt.client.id}`)}
                className="grid w-full grid-cols-5 items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="col-span-2">
                  <p className="text-[15px] font-semibold text-slate-950">
                    {debt.client.fullName}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    {debt.client.phone}
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-sky-600">
                    {money(debt.remainingAmount)} {debt.currency}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    Qoldiq
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-red-500">
                    {days} kun
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    Kechikkan
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-500">
                    OVERDUE
                  </span>

                  <p className="mt-2 text-[12px] font-medium text-slate-400">
                    {debt.dueDate
                      ? new Date(debt.dueDate).toLocaleDateString("ru-RU")
                      : "-"}
                  </p>
                </div>
              </button>
            );
          })}

          {overdueDebts.length === 0 && (
            <div className="p-6 text-sm font-medium text-slate-400">
              Kechikkan qarz yo‘q
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({
  title,
  value,
  blue,
  green,
}: {
  title: string;
  value: string;
  blue?: boolean;
  green?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-slate-400">{title}</p>
      <p
        className={`mt-2 text-[26px] font-semibold tracking-[-0.04em] ${
          blue ? "text-sky-600" : green ? "text-emerald-600" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}