"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type BI = {
  currency: string;
  monthSales: number;
  previousMonthSales: number;
  growthPercent: number;
  monthCount: number;
  avgCheck: number;
  topProduct?: { productName: string; quantity: number; total: number } | null;
};

function money(value: number, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function BIPage() {
  const [currency, setCurrency] = useState("UZS");
  const [data, setData] = useState<BI | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await apiJson<BI>(`/analytics/bi?currency=${currency}`);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "BI yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currency]);

  const cards = [
    { title: "Oylik savdo", value: money(data?.monthSales || 0, currency) },
    { title: "O‘tgan oy", value: money(data?.previousMonthSales || 0, currency) },
    { title: "O‘sish", value: `${data?.growthPercent || 0}%` },
    { title: "O‘rtacha chek", value: money(data?.avgCheck || 0, currency) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold tracking-[-0.04em] text-slate-950">Business Intelligence</h1>
            <p className="mt-2 text-[15px] font-semibold text-slate-500">Savdo, o‘sish, o‘rtacha chek va top mahsulotlar</p>
          </div>
          <div className="flex gap-3">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-13 rounded-2xl border border-slate-200 bg-white px-5 font-bold"><option>UZS</option><option>USD</option></select>
            <button onClick={load} className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white">{loading ? "..." : "Yangilash"}</button>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>}

        <div className="grid gap-5 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-400">{card.title}</p>
              <p className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Top mahsulot</h2>
            {data?.topProduct ? (
              <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-950">{data.topProduct.productName}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Soni: {data.topProduct.quantity}</p>
                <p className="mt-4 text-3xl font-bold text-emerald-600">{money(data.topProduct.total, currency)}</p>
              </div>
            ) : <p className="mt-5 text-slate-400">Hali sotuv ma’lumoti yo‘q</p>}
          </section>
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Xulosa</h2>
            <p className="mt-5 rounded-3xl bg-slate-50 p-5 text-sm font-semibold leading-7 text-slate-600">
              BI dashboard real POS sotuvlardan ishlaydi. Har bir sotuv Cashflow income, sklad OUT movement va analytics datasetga avtomatik tushadi.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
