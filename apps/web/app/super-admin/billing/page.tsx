"use client";

import AppLayout from "../../components/AppLayout";

const rows = [
  { company: "Digi World", plan: "PRO", status: "ACTIVE", next: "30 kun ichida" },
  { company: "Demo Store", plan: "STARTER", status: "TRIAL", next: "1 oy trial" },
  { company: "Business Client", plan: "BUSINESS", status: "ACTIVE", next: "15 kun ichida" },
];

export default function BillingPage() {
  return (
    <AppLayout title="Billing" subtitle="To‘lovlar, trial va obuna holatlari">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-slate-50 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:bg-slate-950">
          <span>Kompaniya</span><span>Plan</span><span>Status</span><span>Keyingi to‘lov</span>
        </div>
        {rows.map((row) => (
          <div key={row.company} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800">
            <span className="font-semibold dark:text-white">{row.company}</span>
            <span className="text-slate-500">{row.plan}</span>
            <span className="text-slate-500">{row.status}</span>
            <span className="text-slate-500">{row.next}</span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
