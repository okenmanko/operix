"use client";

import { useEffect, useState } from "react";
import SuperAdminLayout from "../components/SuperAdminLayout";
import { apiJson, money } from "../lib/api";

type Summary = { companies: number; active: number; trial: number; blocked: number; users: number };

export default function SuperAdminPage() {
  const [summary, setSummary] = useState<Summary>({ companies: 0, active: 0, trial: 0, blocked: 0, users: 0 });
  const [error, setError] = useState("");

  async function load() {
    try { setError(""); setSummary(await apiJson<Summary>("/super-admin/summary")); }
    catch (e: any) { setError(e.message || "Failed to fetch"); }
  }
  useEffect(() => { load(); }, []);

  return (
    <SuperAdminLayout>
      <div className="mb-8 flex items-start justify-between">
        <div><h1 className="text-[36px] font-black tracking-[-0.05em]">Super Admin</h1><p className="mt-2 text-[15px] font-semibold text-[#6c7d95]">Kompaniyalar, userlar, tariflar va SaaS nazorati</p></div>
        <a href="/super-admin/companies" className="rounded-2xl bg-[#2563eb] px-5 py-3 text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.18)] transition hover:bg-[#1d4ed8]">Kompaniya qo‘shish</a>
      </div>
      {error && <div className="mb-6 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-5 py-4 text-sm font-bold text-[#dc2626]">{error}</div>}
      <div className="grid grid-cols-5 gap-4">
        <Card label="Kompaniyalar" value={summary.companies} /><Card label="Active" value={summary.active} /><Card label="Trial" value={summary.trial} /><Card label="Blocked" value={summary.blocked} /><Card label="Userlar" value={summary.users} />
      </div>
      <div className="mt-6 rounded-[28px] border border-[#e6edf5] bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <h2 className="text-[22px] font-black tracking-[-0.04em]">Operix SaaS boshqaruvi</h2>
        <p className="mt-3 max-w-3xl text-[14px] font-semibold leading-7 text-[#6c7d95]">Bu panel orqali kompaniya yaratish, status, plan, modullar va limitlarni boshqarish mumkin. Keyingi patchda billing va subscription lifecycle to‘liq real ishlaydi.</p>
      </div>
    </SuperAdminLayout>
  );
}
function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-[24px] border border-[#e6edf5] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.035)]"><p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#8ba0bb]">{label}</p><p className="mt-4 text-[32px] font-black tracking-[-0.05em]">{money(value)}</p></div>; }
