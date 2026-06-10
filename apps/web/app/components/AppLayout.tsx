"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="ml-[230px] min-h-screen px-10 py-8">
        <header className="mb-8 flex items-start justify-between gap-5">
          <div>
            <h1 className="text-[38px] font-bold tracking-[-0.06em] text-slate-950">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] font-semibold text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-950">Digi World</div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-950">Aziz</div>
            <button className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-[14px] font-bold text-red-600 transition hover:bg-red-50">Chiqish</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
