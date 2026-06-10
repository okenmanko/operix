"use client";

import AppLayout from "../../components/AppLayout";

const plans = [
  { name: "Starter", price: "300 000 so‘m / oy", limit: "1 user, 100 client, basic reports" },
  { name: "Business", price: "700 000 so‘m / oy", limit: "5 user, AI reports, export" },
  { name: "Pro", price: "1 500 000 so‘m / oy", limit: "Unlimited users, AI Director, priority support" },
];

export default function PlansPage() {
  return (
    <AppLayout title="Tariflar" subtitle="Starter, Business va Pro tariflar">
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[22px] font-semibold text-slate-950">{plan.name}</h2>
            <p className="mt-3 text-[24px] font-semibold text-sky-600">{plan.price}</p>
            <p className="mt-3 text-[13px] font-medium text-slate-400">{plan.limit}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
