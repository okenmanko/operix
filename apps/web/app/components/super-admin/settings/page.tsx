"use client";

import AppLayout from "../../components/AppLayout";

export default function AdminSettingsPage() {
  return (
    <AppLayout title="Admin sozlamalar" subtitle="Operix platforma sozlamalari">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[20px] font-semibold text-slate-950">Platforma sozlamalari</h2>
        <p className="mt-2 text-[13px] font-medium text-slate-400">Bu yerda global sozlamalar, security va default modullar bo‘ladi.</p>
      </div>
    </AppLayout>
  );
}
