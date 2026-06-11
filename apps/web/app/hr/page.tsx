'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/operixApi';

export default function HrPage() {
  const [summary, setSummary] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: '', phone: '', position: '', salaryUZS: '' });

  async function load() {
    const [s, e] = await Promise.all([api('/hr/summary'), api('/hr/employees')]);
    setSummary(s || {}); setEmployees(Array.isArray(e) ? e : []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: any) {
    e.preventDefault();
    await api('/hr/employees', { method: 'POST', body: JSON.stringify({ ...form, salaryUZS: Number(form.salaryUZS || 0) }) });
    setForm({ fullName: '', phone: '', position: '', salaryUZS: '' });
    await load();
  }

  async function mark(employeeId: string, status: string) {
    await api('/hr/attendance', { method: 'POST', body: JSON.stringify({ employeeId, status }) });
    await load();
  }

  return (
    <main className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-950">HR</h1><p className="text-slate-500">Xodimlar, davomat, bonus, jarima va oylik fondi.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Xodimlar" value={summary.employees} />
        <Card title="Aktiv" value={summary.activeEmployees} />
        <Card title="Oylik fond" value={summary.salaryFund} />
        <Card title="Net payroll" value={summary.payrollNet} />
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-5">
        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="F.I.Sh" className="rounded-2xl border p-3" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon" className="rounded-2xl border p-3" />
        <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Lavozim" className="rounded-2xl border p-3" />
        <input value={form.salaryUZS} onChange={(e) => setForm({ ...form, salaryUZS: e.target.value })} placeholder="Oylik" className="rounded-2xl border p-3" />
        <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Qo‘shish</button>
      </form>
      <div className="grid gap-4">
        {employees.map((x) => <div key={x.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold">{x.fullName}</h3><p className="text-sm text-slate-500">{x.position || '-'} · {x.phone || '-'}</p><p className="text-sm text-slate-500">Oylik: {fmt(x.salaryUZS)}</p></div><div className="flex gap-2"><button onClick={() => mark(x.id, 'PRESENT')} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Keldi</button><button onClick={() => mark(x.id, 'ABSENT')} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Kelmadi</button></div></div></div>)}
      </div>
    </main>
  );
}
function Card({ title, value }: any) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{title}</p><h3 className="mt-2 text-2xl font-bold">{fmt(value)}</h3></div>; }
function fmt(v: any) { return new Intl.NumberFormat('uz-UZ').format(Number(v || 0)); }
