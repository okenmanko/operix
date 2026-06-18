"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Coins, RefreshCw } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ModuleGate from "../components/ModuleGate";
import CustomSelect from "../components/ui/CustomSelect";
import { Toast } from "../components/ui/Toast";
import { useI18n } from "../lib/i18n";
import { apiJson } from "../lib/api";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PeakMonth = { year: number; month: string; total: number };
type TopProduct = { id: string; name: string; qty: number; total: number; bestMonth?: string | null };
type AnalyticsData = {
  currency: string;
  years: number[];
  monthRows: Record<string, number | string>[];
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
    soldItemsCount: number;
  };
};

const COLORS = ["#315efb", "#0f9f6e", "#d97706", "#7c3aed", "#64748b"];
const EMPTY_DATA: AnalyticsData = {
  currency: "UZS",
  years: [],
  monthRows: [],
  currentMonthComparison: [],
  bestMonths: [],
  topProducts: [],
  summary: { currentYear: new Date().getFullYear(), currentMonth: "", currentYearTotal: 0, previousYearTotal: 0, growthVsLastYear: null, peak: null, soldItemsCount: 0 },
};

const currencyOptions = [
  { value: "UZS", label: "UZS", icon: <Coins size={18} /> },
  { value: "USD", label: "USD", icon: <Coins size={18} /> },
];

const yearOptions = [
  { value: "3", label: "3 yil", icon: <CalendarDays size={18} /> },
  { value: "4", label: "4 yil", icon: <CalendarDays size={18} /> },
  { value: "5", label: "5 yil", icon: <CalendarDays size={18} /> },
];

function money(value: number | string | null | undefined, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
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
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [currency, setCurrency] = useState("UZS");
  const [years, setYears] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const result = await apiJson<AnalyticsData>(`/analytics/sales?years=${years}&currency=${currency}`);
      setData({
        ...EMPTY_DATA,
        ...result,
        years: Array.isArray(result?.years) ? result.years : [],
        monthRows: Array.isArray(result?.monthRows) ? result.monthRows : [],
        currentMonthComparison: Array.isArray(result?.currentMonthComparison) ? result.currentMonthComparison : [],
        bestMonths: Array.isArray(result?.bestMonths) ? result.bestMonths : [],
        topProducts: Array.isArray(result?.topProducts) ? result.topProducts : [],
        summary: { ...EMPTY_DATA.summary, ...(result?.summary || {}) },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analytics yuklanmadi");
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [currency, years]);

  const productChart = useMemo(() => (data.topProducts || []).slice(0, 8).map((product) => ({
    name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name,
    qty: product.qty || 0,
    total: product.total || 0,
  })), [data.topProducts]);

  return (
    <AppLayout title={t("analytics")} subtitle={t("analyticsSubtitle")}>
      <ModuleGate module="ANALYTICS">
        {error ? <Toast type="error">{error}</Toast> : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full max-w-[430px] grid-cols-2 gap-3">
            <CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} />
            <CustomSelect value={years} onChange={setYears} options={yearOptions} />
          </div>
          <button type="button" onClick={load} className="premium-button premium-button-primary"><RefreshCw size={17} /> {t("refresh")}</button>
        </div>

        {loading ? (
          <div className="premium-card p-8 text-[15px] font-normal text-[#64748b]">{t("loading")}</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-lg:grid-cols-1">
              <StatCard label={`${data.summary.currentYear} savdo`} value={money(data.summary.currentYearTotal, data.currency)} hint="Joriy yil" />
              <StatCard label="O‘tgan yil bilan farq" value={percent(data.summary.growthVsLastYear)} hint={money(data.summary.previousYearTotal, data.currency)} />
              <StatCard label="Eng kuchli oy" value={data.summary.peak ? `${data.summary.peak.month} ${data.summary.peak.year}` : "—"} hint={data.summary.peak ? money(data.summary.peak.total, data.currency) : "Hali savdo yo‘q"} />
              <StatCard label="Sotilgan dona" value={String(data.summary.soldItemsCount || 0)} hint="QR/POS bo‘yicha" />
            </div>

            <div className="premium-card p-6">
              <h2 className="text-[22px] font-normal tracking-[-0.04em]">Savdo dinamikasi</h2>
              <p className="mt-1 text-[13px] font-normal text-[#8aa0ba]">Har bir yil alohida chiziq.</p>
              <div className="mt-5 h-[390px] w-full">
                <ResponsiveContainer width="100%" height={390}>
                  <LineChart data={data.monthRows || []} margin={{ top: 10, right: 25, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 400 }} />
                    <YAxis tickFormatter={(value: number | string) => shortMoney(value)} tick={{ fontSize: 12, fontWeight: 400 }} />
                    <Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />
                    <Legend />
                    {(data.years || []).map((year: number, index: number) => (
                      <Line key={year} type="monotone" dataKey={String(year)} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <ChartCard title={`${data.summary.currentMonth || "Joriy oy"} taqqoslash`} subtitle="Joriy oy vs o‘tgan yillar shu oyi.">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.currentMonthComparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 400 }} />
                    <YAxis tickFormatter={(value: number | string) => shortMoney(value)} tick={{ fontSize: 12, fontWeight: 400 }} />
                    <Tooltip formatter={(value: any) => money(Number(value || 0), data.currency)} />
                    <Bar dataKey="total" fill="#315efb" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Eng ko‘p sotilgan tovarlar" subtitle="QR/POS sotuvlar bo‘yicha top mahsulotlar.">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis type="number" tick={{ fontSize: 12, fontWeight: 400 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fontWeight: 400 }} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#0f9f6e" radius={[0, 12, 12, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </ModuleGate>
    </AppLayout>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[13px] font-normal text-[var(--muted)]">{label}</p>
      <p className="mt-5 text-[28px] font-normal tracking-[-0.05em] text-[var(--text)]">{value}</p>
      {hint ? <p className="mt-2 text-[12px] font-normal text-[var(--muted-2)]">{hint}</p> : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">{title}</h2>
      <p className="mt-1 text-[13px] font-normal text-[var(--muted-2)]">{subtitle}</p>
      <div className="mt-5 h-[300px]">{children}</div>
    </div>
  );
}
