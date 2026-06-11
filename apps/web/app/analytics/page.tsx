"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  currency: string;
  years: number[];
  monthRows: Record<string, any>[];
  yearlyTotals: Record<string, number>;
  currentMonthComparison: { year: number; month: string; total: number }[];
  bestMonths: { year: number; month: string; total: number }[];
  topProducts: {
    id: string;
    name: string;
    sku?: string | null;
    brand?: string | null;
    category?: string | null;
    qty: number;
    total: number;
    bestMonth?: string | null;
    bestMonthQty: number;
  }[];
  summary: {
    currentYear: number;
    currentMonth: string;
    currentYearTotal: number;
    previousYearTotal: number;
    growthVsLastYear: number | null;
    peak: { year: number; month: string; total: number } | null;
    weakest: { year: number; month: string; total: number } | null;
    salesCount: number;
    soldItemsCount: number;
  };
};

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#dc2626"];

function money(value: number, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

function shortMoney(value: number) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function percent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <p className="text-[13px] font-semibold text-slate-500">{label}</p>
      <p className="mt-5 text-[28px] font-bold tracking-[-0.05em] text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-[12px] font-semibold text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [currency, setCurrency] = useState("UZS");
  const [years, setYears] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await apiJson<AnalyticsData>(`/analytics/sales?years=${years}&currency=${currency}`);
      setData(result);
    } catch (e: any) {
      setError(e?.message || "Analytics yuklanmadi");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, years]);

  const productChart = useMemo(() => {
    return (data?.topProducts || []).slice(0, 8).map((product) => ({
      name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name,
      qty: product.qty,
      total: product.total,
    }));
  }, [data]);

  return (
    <AppLayout
      title="Analytics"
      subtitle="Real savdo grafiklari: 5 yillik dinamika, oyma-oy taqqoslash va top tovarlar"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-bold outline-none"
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
          <select
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-bold outline-none"
          >
            <option value="3">3 yil</option>
            <option value="4">4 yil</option>
            <option value="5">5 yil</option>
          </select>
        </div>
        <button
          onClick={load}
          className="h-12 rounded-2xl bg-slate-950 px-5 text-[14px] font-bold text-white transition hover:bg-slate-800"
        >
          Yangilash
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] font-bold text-red-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-[15px] font-semibold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          Grafiklar yuklanmoqda...
        </div>
      ) : data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label={`${data.summary.currentYear} savdo`}
              value={money(data.summary.currentYearTotal, data.currency)}
              hint="Joriy yil umumiy savdo"
            />
            <StatCard
              label="O‘tgan yil bilan farq"
              value={percent(data.summary.growthVsLastYear)}
              hint={`${data.summary.currentYear - 1}: ${money(data.summary.previousYearTotal, data.currency)}`}
            />
            <StatCard
              label="Eng kuchli oy"
              value={data.summary.peak ? `${data.summary.peak.month} ${data.summary.peak.year}` : "—"}
              hint={data.summary.peak ? money(data.summary.peak.total, data.currency) : "Hali savdo yo‘q"}
            />
            <StatCard
              label="Sotilgan dona"
              value={String(data.summary.soldItemsCount || 0)}
              hint="POS / QR sotuvlar bo‘yicha"
            />
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">5 yillik savdo dinamikasi</h2>
                <p className="mt-1 text-[13px] font-semibold text-slate-400">Har bir yil alohida chiziq. Qaysi oyda savdo oshgani/pasaygani ko‘rinadi.</p>
              </div>
            </div>

            <div className="h-[390px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthRows} margin={{ top: 10, right: 25, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickFormatter={shortMoney} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />
                  <Legend />
                  {data.years.map((year, index) => (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={String(year)}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
                {data.summary.currentMonth} oyi taqqoslash
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-slate-400">Joriy oy vs o‘tgan yillar shu oyi.</p>
              <div className="mt-5 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.currentMonthComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis tickFormatter={shortMoney} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />
                    <Bar dataKey="total" fill="#2563eb" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Eng ko‘p sotilgan tovarlar</h2>
              <p className="mt-1 text-[13px] font-semibold text-slate-400">QR/POS sotuvlar bo‘yicha top mahsulotlar.</p>
              <div className="mt-5 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#16a34a" radius={[0, 12, 12, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Top oylar</h2>
              <div className="mt-5 space-y-3">
                {data.bestMonths.length ? data.bestMonths.map((item, index) => (
                  <div key={`${item.year}-${item.month}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-[14px] font-bold text-slate-950">#{index + 1} {item.month} {item.year}</p>
                      <p className="text-[12px] font-semibold text-slate-400">Savdo eng yuqori bo‘lgan oy</p>
                    </div>
                    <p className="text-[15px] font-bold text-slate-950">{money(item.total, data.currency)}</p>
                  </div>
                )) : <p className="text-[14px] font-semibold text-slate-400">Hali savdo yo‘q</p>}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Top tovarlar jadvali</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Tovar</th>
                      <th className="px-4 py-3">Dona</th>
                      <th className="px-4 py-3">Summa</th>
                      <th className="px-4 py-3">Eng kuchli oy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.length ? data.topProducts.map((product) => (
                      <tr key={product.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-bold text-slate-950">{product.name}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{product.qty}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{money(product.total, data.currency)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{product.bestMonth || "—"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center font-semibold text-slate-400">Hali QR/POS sotuvlar yo‘q</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
