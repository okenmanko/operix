"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../../lib/api";

type Company = { id: string; name: string; status: string; subscriptionPlan: string };
type Payment = { id: string; amountUZS: number; paidAt: string; periodTo?: string; method?: string; comment?: string; company?: Company };

function money(value: number) { return `${Number(value || 0).toLocaleString("ru-RU")} so‘m`; }

export default function SuperAdminBillingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [form, setForm] = useState({ companyId: "", amountUZS: "", months: "1", method: "CASH", comment: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [c, p, s] = await Promise.all([
        apiJson<any>("/super-admin/companies"),
        apiJson<any>("/super-admin/billing/payments"),
        apiJson<any>("/super-admin/billing/summary"),
      ]);
      setCompanies(c.companies || c || []);
      setPayments(p.payments || []);
      setSummary(s);
    } catch (e: any) {
      setError(e?.message || "Billing yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      setError("");
      await apiJson("/super-admin/billing/payments", { method: "POST", body: JSON.stringify({ ...form, amountUZS: Number(form.amountUZS), months: Number(form.months) }) });
      setForm({ companyId: "", amountUZS: "", months: "1", method: "CASH", comment: "" });
      await load();
    } catch (e: any) { setError(e?.message || "To‘lov saqlanmadi"); }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between">
          <div><h1 className="text-[36px] font-bold tracking-[-0.04em] text-slate-950">Billing</h1><p className="mt-2 font-semibold text-slate-500">Kompaniya oylik to‘lovlari va subscription nazorati</p></div>
          <a href="/super-admin" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold">Super Admin</a>
        </div>
        {error && <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-600">{error}</div>}
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-400">Kompaniyalar</p><p className="mt-3 text-3xl font-bold">{summary?.companies || 0}</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-400">Active</p><p className="mt-3 text-3xl font-bold">{summary?.active || 0}</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-400">Blocked</p><p className="mt-3 text-3xl font-bold">{summary?.blocked || 0}</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-400">Oylik tushum</p><p className="mt-3 text-2xl font-bold">{money(summary?.monthRevenueUZS || 0)}</p></div>
        </div>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">To‘lov qo‘shish</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} className="h-13 rounded-2xl border px-4"><option value="">Kompaniya</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input value={form.amountUZS} onChange={(e) => setForm({ ...form, amountUZS: e.target.value })} placeholder="Summa UZS" type="number" className="h-13 rounded-2xl border px-4" />
            <input value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} placeholder="Oy" type="number" className="h-13 rounded-2xl border px-4" />
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="h-13 rounded-2xl border px-4"><option>CASH</option><option>CARD</option><option>TRANSFER</option><option>CLICK</option></select>
            <button onClick={save} className="rounded-2xl bg-slate-950 px-5 font-bold text-white">Saqlash</button>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">To‘lov tarixi</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="p-4">Kompaniya</th><th>Summa</th><th>Sana</th><th>Period tugashi</th><th>Method</th></tr></thead><tbody>{payments.map((p) => <tr key={p.id} className="border-t"><td className="p-4 font-bold">{p.company?.name}</td><td>{money(p.amountUZS)}</td><td>{new Date(p.paidAt).toLocaleDateString()}</td><td>{p.periodTo ? new Date(p.periodTo).toLocaleDateString() : "-"}</td><td>{p.method}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}
