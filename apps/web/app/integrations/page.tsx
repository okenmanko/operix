"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";

export default function IntegrationsPage() {
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    api('/integrations').then(r => r.json()).then(d => setForm(d || {}));
  }, []);

  async function save() {
    const res = await api('/integrations', { method: 'PATCH', body: JSON.stringify(form) });
    setMessage(res.ok ? 'Saqlandi' : 'Xatolik');
  }

  return (
    <AppLayout title="Integratsiyalar" subtitle="Telegram, MoySklad va 1C sozlamalari">
      <div className="grid grid-cols-2 gap-5">
        <Card title="Telegram bot">
          <Input label="Company bot code" value={form.botCompanyCode || ''} onChange={v => setForm({...form, botCompanyCode:v})} />
          <Input label="Delivery group ID" value={form.telegramDeliveryGroupId || ''} onChange={v => setForm({...form, telegramDeliveryGroupId:v})} />
          <Input label="Report group ID" value={form.telegramReportGroupId || ''} onChange={v => setForm({...form, telegramReportGroupId:v})} />
        </Card>
        <Card title="MoySklad">
          <Input label="MoySklad API URL" value={form.moyskladApiUrl || ''} onChange={v => setForm({...form, moyskladApiUrl:v})} />
          <Input label="MoySklad Token / JSON" value={form.moyskladToken || ''} onChange={v => setForm({...form, moyskladToken:v})} textarea />
        </Card>
        <Card title="1C">
          <Input label="1C API URL" value={form.oneCApiUrl || ''} onChange={v => setForm({...form, oneCApiUrl:v})} />
          <Input label="1C Token / JSON" value={form.oneCToken || ''} onChange={v => setForm({...form, oneCToken:v})} textarea />
        </Card>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white">Saqlash</button>
        {message && <span className="text-sm font-medium text-slate-500">{message}</span>}
      </div>
    </AppLayout>
  );
}

function Card({title, children}:{title:string; children:React.ReactNode}){return <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-[18px] font-semibold text-slate-950">{title}</h2><div className="mt-5 space-y-3">{children}</div></div>}
function Input({label,value,onChange,textarea}:{label:string;value:string;onChange:(v:string)=>void;textarea?:boolean}){return <label className="block"><p className="mb-2 text-[13px] font-semibold text-slate-500">{label}</p>{textarea?<textarea value={value} onChange={e=>onChange(e.target.value)} className="min-h-[110px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"/>:<input value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"/>}</label>}
