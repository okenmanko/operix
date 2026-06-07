"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "../../components/AppLayout";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method?: string;
  comment?: string;
  createdAt: string;
};

type Debt = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  comment?: string;
  dueDate?: string;
  paidAmount: number;
  remainingAmount: number;
  payments: Payment[];
};

type Client = {
  id: string;
  fullName: string;
  phone: string;
  address?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  debts: Debt[];
};

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtCurrency, setDebtCurrency] = useState("UZS");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtComment, setDebtComment] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("UZS");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentComment, setPaymentComment] = useState("");

  async function loadClient() {
    const res = await fetch(`http://localhost:4000/clients/${id}`);
    const data = await res.json();
    setClient(data);
  }

  useEffect(() => {
    loadClient();
  }, [id]);

  async function createDebt() {
    if (!client || !debtAmount) return;

    await fetch("http://localhost:4000/debts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: client.id,
        amount: Number(debtAmount),
        currency: debtCurrency,
        dueDate: debtDueDate || undefined,
        comment: debtComment || undefined,
      }),
    });

    setShowDebtModal(false);
    setDebtAmount("");
    setDebtCurrency("UZS");
    setDebtDueDate("");
    setDebtComment("");

    await loadClient();
  }

  async function createPayment() {
    if (!selectedDebtId || !paymentAmount) return;

    await fetch("http://localhost:4000/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        debtId: selectedDebtId,
        amount: Number(paymentAmount),
        currency: paymentCurrency,
        method: paymentMethod,
        comment: paymentComment || undefined,
      }),
    });

    setShowPaymentModal(false);
    setSelectedDebtId("");
    setPaymentAmount("");
    setPaymentCurrency("UZS");
    setPaymentMethod("cash");
    setPaymentComment("");

    await loadClient();
  }

  if (!client) {
    return (
      <AppLayout title="Client" subtitle="Loading...">
        <div className="card-clean p-6 text-sm font-medium text-slate-500">
          Loading...
        </div>
      </AppLayout>
    );
  }

  const totalDebt = client.debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPaid = client.debts.reduce((sum, d) => sum + Number(d.paidAmount), 0);
  const totalRemaining = client.debts.reduce(
    (sum, d) => sum + Number(d.remainingAmount),
    0,
  );

  return (
    <AppLayout title={client.fullName} subtitle="Mijoz kartasi va qarzlar tarixi">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-500">
          Client ID: <span className="text-slate-700">{client.id.slice(0, 10)}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDebtModal(true)}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Qarz qo‘shish
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tahrirlash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InfoCard title="Telefon" value={client.phone} />
        <InfoCard title="Manzil" value={client.address || "-"} />
        <InfoCard
          title="Kafil"
          value={`${client.guarantorName || "-"} ${client.guarantorPhone || ""}`}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <MoneyCard title="Jami qarz" value={totalDebt} />
        <MoneyCard title="To‘langan" value={totalPaid} green />
        <MoneyCard title="Qoldiq" value={totalRemaining} orange />
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[18px] font-semibold text-slate-950">Qarzlar</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-400">
            Mijozning barcha qarzlari va to‘lovlari
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {client.debts.length === 0 ? (
            <div className="p-6 text-sm font-medium text-slate-400">
              Hozircha qarz yo‘q
            </div>
          ) : (
            client.debts.map((debt) => (
              <div key={debt.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-slate-950">
                      {debt.amount.toLocaleString("ru-RU")} {debt.currency}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-slate-400">
                      {debt.comment || "Izoh yo‘q"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDebtId(debt.id);
                        setPaymentCurrency(debt.currency);
                        setShowPaymentModal(true);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      + To‘lov
                    </button>

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      {debt.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MiniStat title="To‘langan" value={debt.paidAmount} />
                  <MiniStat title="Qoldiq" value={debt.remainingAmount} />
                  <MiniStat
                    title="Muddat"
                    value={
                      debt.dueDate
                        ? new Date(debt.dueDate).toLocaleDateString("ru-RU")
                        : "-"
                    }
                  />
                </div>

                <div className="mt-4 rounded-[16px] bg-slate-50 p-4">
                  <p className="mb-3 text-[13px] font-semibold text-slate-500">
                    To‘lovlar
                  </p>

                  {debt.payments.length === 0 ? (
                    <p className="text-[13px] font-medium text-slate-400">
                      To‘lov yo‘q
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {debt.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-slate-950">
                              {payment.amount.toLocaleString("ru-RU")}{" "}
                              {payment.currency}
                            </p>
                            <p className="text-[12px] font-medium text-slate-400">
                              {payment.method || "-"} • {payment.comment || "-"}
                            </p>
                          </div>

                          <p className="text-[12px] font-medium text-slate-400">
                            {new Date(payment.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl">
            <h2 className="text-[20px] font-semibold text-slate-950">
              Yangi qarz qo‘shish
            </h2>

            <p className="mt-1 text-[13px] font-medium text-slate-400">
              {client.fullName} uchun yangi qarz yarating
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="Summa"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <select
                value={debtCurrency}
                onChange={(e) => setDebtCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>

              <input
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <input
                value={debtComment}
                onChange={(e) => setDebtComment(e.target.value)}
                placeholder="Izoh"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDebtModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={createDebt}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl">
            <h2 className="text-[20px] font-semibold text-slate-950">
              Yangi to‘lov qo‘shish
            </h2>

            <p className="mt-1 text-[13px] font-medium text-slate-400">
              Tanlangan qarz uchun to‘lov kiriting
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Summa"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <select
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="transfer">Transfer</option>
              </select>

              <input
                value={paymentComment}
                onChange={(e) => setPaymentComment(e.target.value)}
                placeholder="Izoh"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={createPayment}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-slate-400">{title}</p>
      <p className="mt-2 text-[16px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MoneyCard({
  title,
  value,
  green,
  orange,
}: {
  title: string;
  value: number;
  green?: boolean;
  orange?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-slate-400">{title}</p>
      <p
        className={`mt-2 text-[24px] font-semibold tracking-[-0.03em] ${
          green
            ? "text-emerald-600"
            : orange
              ? "text-[#FF6B00]"
              : "text-slate-900"
        }`}
      >
        {value.toLocaleString("ru-RU")} UZS
      </p>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[16px] bg-slate-50 p-4">
      <p className="text-[12px] font-medium text-slate-400">{title}</p>
      <p className="mt-1.5 text-[14px] font-semibold text-slate-900">
        {typeof value === "number" ? value.toLocaleString("ru-RU") : value}
      </p>
    </div>
  );
}
