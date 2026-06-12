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

type PeakMonth = {
  year: number;
  month: string;
  total: number;
};

type TopProduct = {
  id: string;
  name: string;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  qty: number;
  total: number;
  bestMonth?: string | null;
  bestMonthQty: number;
};

type AnalyticsData = {
  currency: string;
  years: number[];
  monthRows: Record<string, number | string>[];
  yearlyTotals: Record<string, number>;
  currentMonthComparison: PeakMonth[];
  bestMonths: PeakMonth[];
  topProducts: TopProduct[];
  summary: {
    currentYear: number;
    currentMonth: string;
    currentYearTotal: number;
    previousYearTotal: number;
    growthVsLastYear: number | null;
    peak: PeakMonth | null;
    weakest: PeakMonth | null;
    salesCount: number;
    soldItemsCount: number;
  };
};

const COLORS = ["#315efb", "#0f9f6e", "#d97706", "#7c3aed", "#64748b"];

const EMPTY_DATA: AnalyticsData = {
  currency: "UZS",
  years: [],
  monthRows: [],
  yearlyTotals: {},
  currentMonthComparison: [],
  bestMonths: [],
  topProducts: [],
  summary: {
    currentYear: new Date().getFullYear(),
    currentMonth: "",
    currentYearTotal: 0,
    previousYearTotal: 0,
    growthVsLastYear: null,
    peak: null,
    weakest: null,
    salesCount: 0,
    soldItemsCount: 0,
  },
};

function money(value: number | string | null | undefined, currency = "UZS") {
  const n = Number(value || 0);
  return `${n.toLocaleString("ru-RU")} ${currency}`;
}

function shortMoney(value: number | string | null | undefined) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [currency, setCurrency] = useState("UZS");
  const [years, setYears] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await apiJson<AnalyticsData>(
        `/analytics/sales?years=${years}&currency=${currency}`,
      );

      setData({
        ...EMPTY_DATA,
        ...result,
        years: Array.isArray(result?.years) ? result.years : [],
        monthRows: Array.isArray(result?.monthRows) ? result.monthRows : [],
        currentMonthComparison: Array.isArray(result?.currentMonthComparison)
          ? result.currentMonthComparison
          : [],
        bestMonths: Array.isArray(result?.bestMonths) ? result.bestMonths : [],
        topProducts: Array.isArray(result?.topProducts) ? result.topProducts : [],
        summary: {
          ...EMPTY_DATA.summary,
          ...(result?.summary || {}),
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analytics yuklanmadi");
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, years]);

  const productChart = useMemo(() => {
    return (data.topProducts || []).slice(0, 8).map((product: TopProduct) => ({
      name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name,
      qty: product.qty || 0,
      total: product.total || 0,
    }));
  }, [data.topProducts]);

  return (
    <AppLayout
      title="Analytics"
      subtitle="Real savdo grafiklari: 5 yillik dinamika, oyma-oy taqqoslash va top tovarlar"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={currency}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCurrency(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium outline-none"
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>

          <select
            value={years}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setYears(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium outline-none"
          >
            <option value="3">3 yil</option>
            <option value="4">4 yil</option>
            <option value="5">5 yil</option>
          </select>
        </div>

        <button
          type="button"
          onClick={load}
          className="h-12 rounded-2xl bg-slate-950 px-5 text-[14px] font-medium text-white transition hover:bg-slate-800"
        >
          Yangilash
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-[15px] font-medium text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          Grafiklar yuklanmoqda...
        </div>
      ) : (
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
            <div className="mb-5">
              <h2 className="text-[22px] font-medium tracking-[-0.04em] text-slate-950">
                5 yillik savdo dinamikasi
              </h2>
              <p className="mt-1 text-[13px] font-normal text-slate-400">
                Har bir yil alohida chiziq.
              </p>
            </div>

            <div className="h-[390px] w-full">
              <ResponsiveContainer width={900} height={350}>
                <LineChart data={data.monthRows || []} margin={{ top: 10, right: 25, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 400 }} />
                  <YAxis tickFormatter={(value: number | string) => shortMoney(value)} tick={{ fontSize: 12, fontWeight: 400 }} />
                  <Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />                  <Legend />

                  {(data.years || []).map((year: number, index: number) => (
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
            <ChartCard title={`${data.summary.currentMonth || "Joriy oy"} taqqoslash`} subtitle="Joriy oy vs o‘tgan yillar shu oyi.">
              <ResponsiveContainer width={900} height={350}>
                <BarChart data={data.currentMonthComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 400 }} />
                  <YAxis tickFormatter={(value: number | string) => shortMoney(value)} tick={{ fontSize: 12, fontWeight: 400 }} />
<Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />
                    <Bar dataKey="total" fill="#315efb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Eng ko‘p sotilgan tovarlar" subtitle="QR/POS sotuvlar bo‘yicha top mahsulotlar.">
              <ResponsiveContainer width={900} height={350}>
                <BarChart data={productChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fontWeight: 400 }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fontWeight: 400 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#0f9f6e" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-medium tracking-[-0.04em] text-slate-950">Top oylar</h2>
              <div className="mt-5 space-y-3">
                {(data.bestMonths || []).length ? (
                  (data.bestMonths || []).map((item: PeakMonth, index: number) => (
                    <div key={`${item.year}-${item.month}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-[14px] font-medium text-slate-950">
                          #{index + 1} {item.month} {item.year}
                        </p>
                        <p className="text-[12px] font-normal text-slate-400">Savdo eng yuqori bo‘lgan oy</p>
                      </div>
                      <p className="text-[15px] font-medium text-slate-950">{money(item.total, data.currency)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[14px] font-normal text-slate-400">Hali savdo yo‘q</p>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-[22px] font-medium tracking-[-0.04em] text-slate-950">Top tovarlar jadvali</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-normal">Tovar</th>
                      <th className="px-4 py-3 font-normal">Dona</th>
                      <th className="px-4 py-3 font-normal">Summa</th>
                      <th className="px-4 py-3 font-normal">Eng kuchli oy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topProducts || []).length ? (
                      (data.topProducts || []).map((product: TopProduct) => (
                        <tr key={product.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-950">{product.name}</td>
                          <td className="px-4 py-3 font-normal text-slate-600">{product.qty}</td>
                          <td className="px-4 py-3 font-normal text-slate-600">{money(product.total, data.currency)}</td>
                          <td className="px-4 py-3 font-normal text-slate-600">{product.bestMonth || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center font-normal text-slate-400">
                          Hali QR/POS sotuvlar yo‘q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <p className="text-[13px] font-normal text-slate-500">{label}</p>
      <p className="mt-5 text-[28px] font-medium tracking-[-0.05em] text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-[12px] font-normal text-slate-400">{hint}</p> : null}
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
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <h2 className="text-[22px] font-medium tracking-[-0.04em] text-slate-950">{title}</h2>
      <p className="mt-1 text-[13px] font-normal text-slate-400">{subtitle}</p>
      <div className="mt-5 h-[300px]">{children}</div>
    </div>
  );
}
