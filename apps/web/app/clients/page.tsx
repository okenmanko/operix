"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Client = { id: string; fullName: string; phone?: string; address?: string | null; notes?: string | null; createdAt?: string; };

function toArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.clients)) return value.clients;
  if (Array.isArray(value?.debts)) return value.debts;
  if (Array.isArray(value?.payments)) return value.payments;
  if (Array.isArray(value?.reports)) return value.reports;
  return [];
}

function money(value: any, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    try { setClients(toArray<Client>(await apiJson<any>("/clients"))); } catch { setClients([]); }
  }

  useEffect(() => { load(); }, []);

  const safeClients = Array.isArray(clients) ? clients : [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return safeClients;
    return safeClients.filter((c) => [c.fullName, c.phone, c.address, c.notes].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [safeClients, search]);

  return (
    <AppLayout title="Mijozlar" subtitle="Mijozlar bazasi">
      <div className="mb-5 grid grid-cols-3 gap-4">
        {[['Jami mijozlar', safeClients.length], ['Qidiruv', filtered.length], ['Status', 'Active']].map(([l, v]) => (
          <div key={String(l)} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-[13px] font-semibold text-slate-500">{l}</p>
            <p className="mt-8 text-[30px] font-semibold tracking-[-0.06em] text-slate-950">{v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Mijozlar</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="h-11 w-[320px] rounded-2xl border border-slate-200 px-4 text-[14px] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1fr_180px_1fr_140px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400"><div>Mijoz</div><div>Telefon</div><div>Manzil/Izoh</div><div className="text-right">Sana</div></div>
          {filtered.length === 0 ? <div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div> : filtered.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_180px_1fr_140px] items-center border-t border-slate-100 px-4 py-4">
              <div><p className="text-[14px] font-bold text-slate-950">{c.fullName}</p></div>
              <div className="text-[13px] font-semibold text-slate-600">{c.phone || '-'}</div>
              <div><p className="text-[13px] font-semibold text-slate-600">{c.address || '-'}</p><p className="mt-1 text-[12px] text-slate-400">{c.notes || '-'}</p></div>
              <div className="text-right text-[12px] font-semibold text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
