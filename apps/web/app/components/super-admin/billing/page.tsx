"use client";

import AppLayout from "../../components/AppLayout";

export default function BillingPage() {
  return (
    <AppLayout title="Billing" subtitle="To‘lovlar, obunalar va qarzdor kompaniyalar">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[20px] font-semibold text-slate-950">Billing markazi</h2>
        <p className="mt-2 text-[13px] font-medium text-slate-400">Bu yerda keyin kompaniya to‘lovlari, muddati va invoice tarixi bo‘ladi.</p>
      </div>
    </AppLayout>
  );
}
