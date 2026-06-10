"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Debt = { id:string; amount:number; currency:string; status:string; dueDate?:string|null; comment?:string|null; client?:{fullName?:string;phone?:string}|null };

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

function isOverdue(d: Debt) { if (!d.dueDate || d.status === "CLOSED") return false; const due = new Date(d.dueDate); due.setHours(23,59,59,999); return due.getTime() < Date.now(); }
export default function DebtsPage() {
 const [debts,setDebts]=useState<Debt[]>([]); const [search,setSearch]=useState("");
 async function load(){ try{ setDebts(toArray<Debt>(await apiJson<any>("/debts"))); }catch{ setDebts([]);} }
 useEffect(()=>{load();},[]);
 const safeDebts=Array.isArray(debts)?debts:[]; const active=safeDebts.filter(d=>d.status!=="CLOSED"); const overdue=safeDebts.filter(isOverdue);
 const filtered=useMemo(()=>{ const q=search.trim().toLowerCase(); if(!q)return safeDebts; return safeDebts.filter(d=>[d.client?.fullName,d.client?.phone,d.amount,d.currency,d.status,d.comment].filter(Boolean).join(" ").toLowerCase().includes(q));},[safeDebts,search]);
 const totalUZS=active.filter(d=>d.currency==="UZS").reduce((s,d)=>s+Number(d.amount||0),0); const totalUSD=active.filter(d=>d.currency==="USD").reduce((s,d)=>s+Number(d.amount||0),0);
 return <AppLayout title="Qarzlar" subtitle="Faol qarzlar va kechikkanlar"><div className="mb-5 grid grid-cols-4 gap-4">{[["Faol",active.length],["Kechikkan",overdue.length],["UZS",money(totalUZS,"UZS")],["USD",money(totalUSD,"USD")]].map(([l,v])=><div key={String(l)} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><p className="text-[13px] font-semibold text-slate-500">{l}</p><p className="mt-8 text-[24px] font-semibold tracking-[-0.05em] text-slate-950">{v}</p></div>)}</div><div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between"><h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Qarzlar</h2><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Qidirish..." className="h-11 w-[320px] rounded-2xl border border-slate-200 px-4 text-[14px] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"/></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-[1fr_160px_160px_120px_130px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400"><div>Mijoz</div><div>Telefon</div><div className="text-right">Summa</div><div className="text-right">Status</div><div className="text-right">Muddat</div></div>{filtered.length===0?<div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>:filtered.map(d=><div key={d.id} className="grid grid-cols-[1fr_160px_160px_120px_130px] items-center border-t border-slate-100 px-4 py-4"><div><p className="text-[14px] font-bold text-slate-950">{d.client?.fullName||"-"}</p><p className="mt-1 text-[12px] text-slate-400">{d.comment||"-"}</p></div><div className="text-[13px] font-semibold text-slate-600">{d.client?.phone||"-"}</div><div className="text-right text-[14px] font-bold text-slate-950">{money(d.amount,d.currency)}</div><div className="text-right"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${d.status==="CLOSED"?"bg-emerald-50 text-emerald-600":isOverdue(d)?"bg-red-50 text-red-600":"bg-sky-50 text-sky-600"}`}>{d.status}</span></div><div className="text-right text-[12px] font-semibold text-slate-400">{d.dueDate?new Date(d.dueDate).toLocaleDateString():"-"}</div></div>)}</div></div></AppLayout>
}
