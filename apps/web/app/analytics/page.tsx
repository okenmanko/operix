"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppLayout from "../components/AppLayout";

const revenue = [
  { month: "Yan", value: 180 }, { month: "Fev", value: 210 }, { month: "Mar", value: 260 }, { month: "Apr", value: 320 }, { month: "May", value: 410 }, { month: "Iyun", value: 480 },
];
const top = [
  { name: "CRM", value: 42 }, { name: "Delivery", value: 28 }, { name: "HR", value: 16 }, { name: "MoySklad", value: 10 },
];
export default function AnalyticsPage() {
  return (
    <AppLayout title="Analytics" subtitle="Business va Pro uchun ideal chartlar">
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Oylik tushum trendi">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" strokeWidth={3} dot={false} /></LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Modullar bo‘yicha aktivlik">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" radius={[12,12,0,0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AppLayout>
  );
}
function ChartCard({ title, children }: any) { return <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-5 text-[20px] font-semibold dark:text-white">{title}</h2>{children}</div> }
