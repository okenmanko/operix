"use client";
import AppLayout from "../components/AppLayout";

export default function HRPage() {
  return (
    <AppLayout title="HR" subtitle="Hodimlar, rollar va ish jarayonlari">
      <div className="grid grid-cols-3 gap-4">
        <Card title="Hodimlar" value="0" text="User management backendga ulanadi" />
        <Card title="Faol hodimlar" value="0" text="isActive holati bo‘yicha" />
        <Card title="Rollar" value="OWNER / MANAGER / COLLECTOR" text="Keyinroq HR rollar kengayadi" />
      </div>
      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-[20px] font-semibold dark:text-white">HR moduli homaki</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">Bu yerda hodimlar, ish vaqti, role va access control boshqariladi.</p>
      </div>
    </AppLayout>
  );
}
function Card({ title, value, text }: any) { return <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-400">{title}</p><p className="mt-3 text-[24px] font-semibold dark:text-white">{value}</p><p className="mt-2 text-xs text-slate-400">{text}</p></div> }
