"use client";

import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "./AppLayout";
import type { ModuleKey } from "../lib/operix";
import { moduleCatalog } from "../lib/operix";

const trendData = [
  { month: "Yan", value: 42, second: 18 },
  { month: "Fev", value: 58, second: 26 },
  { month: "Mar", value: 64, second: 31 },
  { month: "Apr", value: 77, second: 42 },
  { month: "May", value: 92, second: 54 },
  { month: "Iyun", value: 118, second: 67 },
];

const moduleMetrics: Record<ModuleKey, Array<{ title: string; value: string; note: string }>> = {
  CRM: [
    { title: "Mijozlar", value: "1 248", note: "+12% oy ichida" },
    { title: "Faol qarzlar", value: "312", note: "nazoratda" },
    { title: "Bugungi tushum", value: "84.2M", note: "UZS" },
  ],
  HR: [
    { title: "Hodimlar", value: "38", note: "aktiv" },
    { title: "Vakansiyalar", value: "6", note: "ochiq" },
    { title: "Davomat", value: "94%", note: "bugun" },
  ],
  DELIVERY: [
    { title: "Zayavkalar", value: "74", note: "bugun" },
    { title: "Yetkazildi", value: "58", note: "78%" },
    { title: "Kuryerlar", value: "9", note: "online" },
  ],
  MOYSKLAD: [
    { title: "Kontragentlar", value: "2 814", note: "sync" },
    { title: "Omborlar", value: "7", note: "active" },
    { title: "Oxirgi sync", value: "3 min", note: "oldin" },
  ],
  ONE_C: [
    { title: "Hujjatlar", value: "1 092", note: "sync" },
    { title: "Accounting", value: "OK", note: "status" },
    { title: "Queue", value: "12", note: "kutmoqda" },
  ],
  ANALYTICS: [
    { title: "Revenue", value: "2.4B", note: "UZS" },
    { title: "Collection", value: "83%", note: "rate" },
    { title: "Growth", value: "+18%", note: "oylik" },
  ],
  KPI: [
    { title: "Top KPI", value: "96%", note: "sotuvchi" },
    { title: "O‘rtacha KPI", value: "81%", note: "jamoa" },
    { title: "Risk", value: "4", note: "hodim" },
  ],
  AI_DIRECTOR: [
    { title: "Savollar", value: "148", note: "oyda" },
    { title: "Insight", value: "32", note: "tayyor" },
    { title: "Risk alert", value: "7", note: "bugun" },
  ],
};

export default function ModuleDashboard({
  moduleKey,
  title,
  subtitle,
}: {
  moduleKey: ModuleKey;
  title?: string;
  subtitle?: string;
}) {
  const module = moduleCatalog[moduleKey];
  const metrics = moduleMetrics[moduleKey];

  return (
    <AppLayout title={title || module.labelUz} subtitle={subtitle || module.description}>
      <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${module.gradient} p-7 text-white shadow-sm`}>
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold backdrop-blur">
              <Sparkles size={14} /> Operix Module
            </div>
            <h2 className="mt-5 text-[34px] font-semibold tracking-[-0.045em]">{module.labelUz}</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-white/80">{module.description}</p>
          </div>
          <div className="hidden rounded-3xl bg-white/15 p-5 backdrop-blur lg:block">
            <p className="text-[12px] font-bold text-white/70">Status</p>
            <p className="mt-1 text-[24px] font-semibold">Connected</p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {metrics.map((item) => (
          <div key={item.title} className="op-card p-5">
            <p className="text-[13px] font-bold op-muted">{item.title}</p>
            <p className="mt-3 text-[30px] font-semibold tracking-[-0.045em] op-text">{item.value}</p>
            <p className="mt-1 text-[12px] font-bold op-primary">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-5 gap-5">
        <div className="op-card col-span-3 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-[20px] font-semibold tracking-[-0.03em] op-text">Asosiy dinamika</h3>
              <p className="mt-1 text-[13px] font-semibold op-muted">So‘nggi 6 oy bo‘yicha trend</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id={`gradient-${moduleKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill={`url(#gradient-${moduleKey})`} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="op-card col-span-2 p-6">
          <h3 className="text-[20px] font-semibold tracking-[-0.03em] op-text">Modul imkoniyatlari</h3>
          <div className="mt-5 space-y-3">
            {module.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-2xl op-soft px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-[13px] font-bold op-text">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="op-card p-6">
          <h3 className="text-[18px] font-semibold op-text">Workflow</h3>
          <div className="mt-5 space-y-3">
            {['Yangi data', 'Tasdiqlash', 'Avtomatik update', 'Hisobot'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-[12px] font-bold text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">{index + 1}</div>
                <p className="text-[13px] font-bold op-text">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="op-card p-6">
          <h3 className="text-[18px] font-semibold op-text">Health</h3>
          <div className="mt-5 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData.slice(-4)}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="second" fill="#10b981" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="op-card p-6">
          <h3 className="text-[18px] font-semibold op-text">Keyingi bosqich</h3>
          <div className="mt-5 rounded-3xl border border-dashed op-border p-5">
            <Lock size={22} className="op-muted" />
            <p className="mt-3 text-[14px] font-bold op-text">Backend integratsiya</p>
            <p className="mt-1 text-[12px] font-semibold leading-6 op-muted">Bu sahifa front tomonda ideal tayyor. Keyingi bosqichda real API va database data ulanadi.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
