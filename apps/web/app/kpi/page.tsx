"use client";
import AppLayout from "../components/AppLayout";

const items = ["Sotuvchi KPI", "Kollektor KPI", "Kuryer KPI", "Operator KPI", "HR KPI", "Manager KPI"];
export default function KPIPage() {
  return (
    <AppLayout title="KPI" subtitle="Faqat Pro uchun hodimlar samaradorligi">
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => <div key={item} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-[18px] font-semibold dark:text-white">{item}</p><p className="mt-2 text-sm text-slate-400">Homaki modul, keyin real formula ulanadi</p></div>)}
      </div>
    </AppLayout>
  );
}
