"use client";

import AppLayout from "../../components/AppLayout";

const modules = [
  { name: "CRM", desc: "Mijozlar, qarzlar, to‘lovlar", status: "READY" },
  { name: "Delivery", desc: "Dostavka, courier workflow, photo proof", status: "SOON" },
  { name: "MoySklad", desc: "MoySklad integratsiya", status: "SOON" },
  { name: "1C", desc: "1C integratsiya", status: "SOON" },
  { name: "AI Director", desc: "Rahbar uchun AI analitika", status: "SOON" },
];

export default function ModulesPage() {
  return (
    <AppLayout title="Modullar" subtitle="Operix platforma modullari">
      <div className="grid grid-cols-3 gap-4">
        {modules.map((module) => (
          <div key={module.name} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-slate-950">{module.name}</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-600">{module.status}</span>
            </div>
            <p className="mt-2 text-[13px] font-medium text-slate-400">{module.desc}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
