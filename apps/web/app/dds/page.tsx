'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/operixApi';

export default function DdsPage() {
  const [summary, setSummary] = useState<any>({});
  const [monthly, setMonthly] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'INCOME', amount: '', category: '', method: 'CASH', description: '' });

  async function load() {
    const [s, m, r] = await Promise.all([api('/dds/summary'), api('/dds/monthly'), api('/dds')]);
    setSummary(s || {}); setMonthly(Array.isArray(m) ? m : []); setRows(Array.isArray(r) ? r : []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: any) {
    e.preventDefault();
    await api('/dds', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setForm({ type: 'INCOME', amount: '', category: '', method: 'CASH', description: '' });
    await load();
  }

  return (
    <main className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-950">DDS Pro</h1><p className="text-slate-500">Kirim, chiqim, foyda va cash gap nazorati.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Kirim" value={summary.income} />
        <Card title="Chiqim" value={summary.expense} />
        <Card title="Sof foyda" value={summary.profit} />
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-6">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-2xl border p-3"><option value="INCOME">Kirim</option><option value="EXPENSE">Chiqim</option></select>
        <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Summa" className="rounded-2xl border p-3" />
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Kategoriya" className="rounded-2xl border p-3" />
        <input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Metod" className="rounded-2xl border p-3" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Izoh" className="rounded-2xl border p-3" />
        <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Saqlash</button>
      </form>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">12 oylik harakat</h2>
        <div className="space-y-2">{monthly.map((x) => <div key={x.month} className="grid grid-cols-4 rounded-2xl bg-slate-50 p-3 text-sm"><b>{x.month}</b><span>Kirim: {fmt(x.income)}</span><span>Chiqim: {fmt(x.expense)}</span><span>Foyda: {fmt(x.profit)}</span></div>)}</div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Oxirgi operatsiyalar</h2>
        <div className="space-y-2">{rows.map((x) => <div key={x.id} className="grid grid-cols-5 rounded-2xl bg-slate-50 p-3 text-sm"><b>{x.type}</b><span>{fmt(x.amount)}</span><span>{x.category || '-'}</span><span>{x.method || '-'}</span><span>{new Date(x.createdAt).toLocaleDateString()}</span></div>)}</div>
      </div>
    </main>
  );
}

function Card({ title, value }: any) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{title}</p><h3 className="mt-2 text-2xl font-bold">{fmt(value)}</h3></div>; }
function fmt(v: any) { return new Intl.NumberFormat('uz-UZ').format(Number(v || 0)); }
