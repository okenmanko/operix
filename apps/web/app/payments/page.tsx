"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method?: string;
  comment?: string;
  createdAt: string;
  debt: {
    amount: number;
    currency: string;
    client: {
      fullName: string;
      phone: string;
    };
  };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch("http://localhost:4000/payments")
      .then((res) => res.json())
      .then(setPayments)
      .catch(console.error);
  }, []);

  return (
    <AppLayout title="To‘lovlar" subtitle="Mijozlardan qabul qilingan to‘lovlar tarixi">
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-black text-slate-950">To‘lovlar ro‘yxati</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Jami: {payments.length} ta to‘lov
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            + Yangi to‘lov
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Mijoz
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Summa
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Usul
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Izoh
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Sana
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-100 transition hover:bg-orange-50/40"
                >
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-950">
                      {payment.debt?.client?.fullName}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">
                      {payment.debt?.client?.phone}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm font-black text-emerald-600">
                    {payment.amount.toLocaleString("ru-RU")} {payment.currency}
                  </td>

                  <td className="px-6 py-5 text-sm font-bold text-slate-600">
                    {payment.method || "-"}
                  </td>

                  <td className="px-6 py-5 text-sm font-bold text-slate-600">
                    {payment.comment || "-"}
                  </td>

                  <td className="px-6 py-5 text-sm font-bold text-slate-500">
                    {new Date(payment.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}