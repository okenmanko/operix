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
  createdAt: string;
  paidAmount: number;
  remainingAmount: number;
  client: {
    id: string;
    fullName: string;
    phone: string;
  };
};

type Filter = "ALL" | "ACTIVE" | "CLOSED" | "TODAY" | "OVERDUE" | "USD" | "UZS";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value?: string) {
  if (!value) return "-";

  let digits = onlyDigits(value);

  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.startsWith("8")) digits = digits.slice(1);

  digits = digits.slice(0, 9);

  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 7);
  const d = digits.slice(7, 9);

  let result = "+998";

  if (a) result += ` ${a}`;
  if (b) result += ` ${b}`;
  if (c) result += ` ${c}`;
  if (d) result += ` ${d}`;

  return result;
}

function isSameDay(date?: string) {
  if (!date) return false;

  const d = new Date(date);
  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function isOverdue(debt: Debt) {
  if (!debt.dueDate || debt.status === "CLOSED") return false;

  const due = new Date(debt.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today;
}

function overdueDays(debt: Debt) {
  if (!isOverdue(debt) || !debt.dueDate) return 0;

  const due = new Date(debt.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function money(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

export default function DebtsPage() {
  const router = useRouter();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    const res = await fetch("http://localhost:4000/debts");
    const data = await res.json();
    setDebts(data);
  }

  const activeDebts = debts.filter((debt) => debt.status !== "CLOSED");
  const overdueDebts = debts.filter((debt) => isOverdue(debt));
  const todayDebts = debts.filter((debt) => isSameDay(debt.dueDate));

  const activeUzs = activeDebts
    .filter((debt) => debt.currency === "UZS")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  const activeUsd = activeDebts
    .filter((debt) => debt.currency === "USD")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  const overdueUzs = overdueDebts
    .filter((debt) => debt.currency === "UZS")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  const overdueUsd = overdueDebts
    .filter((debt) => debt.currency === "USD")
    .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

  const filteredDebts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = onlyDigits(search);

    return debts
      .filter((debt) => {
        if (filter === "ACTIVE") return debt.status !== "CLOSED";
        if (filter === "CLOSED") return debt.status === "CLOSED";
        if (filter === "TODAY") return isSameDay(debt.dueDate);
        if (filter === "OVERDUE") return isOverdue(debt);
        if (filter === "USD") return debt.currency === "USD";
        if (filter === "UZS") return debt.currency === "UZS";
        return true;
      })
      .filter((debt) => {
        if (!q) return true;

        const phoneDigits = onlyDigits(debt.client.phone);

        return (
          debt.client.fullName.toLowerCase().includes(q) ||
          debt.client.phone.toLowerCase().includes(q) ||
          phoneDigits.includes(qDigits) ||
          phoneDigits.endsWith(qDigits) ||
          (debt.comment || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (isOverdue(a) && !isOverdue(b)) return -1;
        if (!isOverdue(a) && isOverdue(b)) return 1;
        return Number(b.remainingAmount) - Number(a.remainingAmount);
      });
  }, [debts, search, filter]);

  return (
    <AppLayout title="Qarzlar" subtitle="Qarzlarni nazorat qilish markazi">
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="Aktiv qarz"
          main={`${money(activeUzs)} UZS`}
          sub={`${money(activeUsd)} USD`}
        />

        <SummaryCard
          title="Muddati o‘tgan"
          main={`${money(overdueUzs)} UZS`}
          sub={`${money(overdueUsd)} USD`}
          danger
        />

        <SummaryCard
          title="Bugun to‘lanadi"
          main={`${todayDebts.length} ta`}
          sub="Muddat bugun"
        />

        <SummaryCard
          title="Aktiv mijozlar"
          main={`${activeDebts.length} ta`}
          sub="Yopilmagan qarzlar"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mijoz, telefon, oxirgi 4 raqam yoki izoh..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-slate-400"
        />

        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>
            Barchasi
          </FilterButton>
          <FilterButton
            active={filter === "ACTIVE"}
            onClick={() => setFilter("ACTIVE")}
          >
            Active
          </FilterButton>
          <FilterButton
            active={filter === "OVERDUE"}
            onClick={() => setFilter("OVERDUE")}
          >
            Kechikkan
          </FilterButton>
          <FilterButton
            active={filter === "TODAY"}
            onClick={() => setFilter("TODAY")}
          >
            Bugun
          </FilterButton>
          <FilterButton active={filter === "USD"} onClick={() => setFilter("USD")}>
            USD
          </FilterButton>
          <FilterButton active={filter === "UZS"} onClick={() => setFilter("UZS")}>
            UZS
          </FilterButton>
          <FilterButton
            active={filter === "CLOSED"}
            onClick={() => setFilter("CLOSED")}
          >
            Closed
          </FilterButton>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[18px] font-semibold text-slate-950">
            Qarzlar ro‘yxati
          </h2>

          <p className="mt-1 text-[13px] font-medium text-slate-400">
            Jami: {filteredDebts.length} ta qarz
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDebts.map((debt) => {
            const overdue = isOverdue(debt);
            const days = overdueDays(debt);

            return (
              <button
                key={debt.id}
                type="button"
                onClick={() => router.push(`/clients/${debt.client.id}`)}
                className="grid w-full grid-cols-6 items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="col-span-2">
                  <p className="text-[15px] font-semibold text-slate-950">
                    {debt.client.fullName}
                  </p>

                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    {formatPhone(debt.client.phone)}
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-slate-950">
                    {money(debt.amount)} {debt.currency}
                  </p>

                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    Jami qarz
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-emerald-600">
                    {money(debt.paidAmount)} {debt.currency}
                  </p>

                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    To‘langan
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-[#3B82F6]">
                    {money(debt.remainingAmount)} {debt.currency}
                  </p>

                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    Qoldiq
                  </p>
                </div>

                <div className="flex justify-end">
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        debt.status === "CLOSED"
                          ? "bg-emerald-50 text-emerald-600"
                          : overdue
                            ? "bg-red-50 text-red-600"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {debt.status === "CLOSED"
                        ? "CLOSED"
                        : overdue
                          ? `${days} kun kechikkan`
                          : "ACTIVE"}
                    </span>

                    <p className="mt-2 text-[12px] font-medium text-slate-400">
                      {debt.dueDate
                        ? new Date(debt.dueDate).toLocaleDateString("ru-RU")
                        : "Muddat yo‘q"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredDebts.length === 0 && (
            <div className="p-6 text-sm font-medium text-slate-400">
              Qarz topilmadi
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({
  title,
  main,
  sub,
  danger,
}: {
  title: string;
  main: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-slate-400">{title}</p>
      <p
        className={`mt-3 text-[24px] font-semibold tracking-[-0.04em] ${
          danger ? "text-red-600" : "text-slate-950"
        }`}
      >
        {main}
      </p>
      <p className="mt-1 text-[13px] font-medium text-slate-400">{sub}</p>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${
        active
          ? "bg-[#3B82F6] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}