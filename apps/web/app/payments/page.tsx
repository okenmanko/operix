"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Payment = { id:string; amount:number; currency:string; method?:string|null; comment?:string|null; createdAt?:string; debt?:{client?:{fullName?:string;phone?:string}|null}|null };

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

export default function PaymentsPage(){
 const [payments,setPayments]=useState<Payment[]>([]); const [search,setSearch]=useState("");
 async function load(){ try{ setPayments(toArray<Payment>(await apiJson<any>("/payments"))); }catch{ setPayments([]);} }
 useEffect(()=>{load();},[]);
 const safePayments=Array.isArray(payments)?payments:[];
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase(); if(!q)return safePayments; return safePayments.filter(p=>[p.debt?.client?.fullName,p.debt?.client?.phone,p.amount,p.currency,p.method,p.comment].filter(Boolean).join(" ").toLowerCase().includes(q));},[safePayments,search]);
 const totalUZS=safePayments.filter(p=>p.currency==="UZS").reduce((s,p)=>s+Number(p.amount||0),0); const totalUSD=safePayments.filter(p=>p.currency==="USD").reduce((s,p)=>s+Number(p.amount||0),0);
 return <AppLayout title="To‘lovlar" subtitle="To‘lovlar tarixi"><div className="mb-5 grid grid-cols-3 gap-4">{[["Jami",safePayments.length],["UZS",money(totalUZS,"UZS")],["USD",money(totalUSD,"USD")]].map(([l,v])=><div key={String(l)} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><p className="text-[13px] font-semibold text-slate-500">{l}</p><p className="mt-8 text-[24px] font-semibold tracking-[-0.05em] text-slate-950">{v}</p></div>)}</div><div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between"><h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">To‘lovlar</h2><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Qidirish..." className="h-11 w-[320px] rounded-2xl border border-slate-200 px-4 text-[14px] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"/></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-[1fr_160px_140px_150px_150px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400"><div>Mijoz</div><div>Telefon</div><div>Usul</div><div className="text-right">Summa</div><div className="text-right">Sana</div></div>{filtered.length===0?<div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>:filtered.map(p=><div key={p.id} className="grid grid-cols-[1fr_160px_140px_150px_150px] items-center border-t border-slate-100 px-4 py-4"><div><p className="text-[14px] font-bold text-slate-950">{p.debt?.client?.fullName||"-"}</p><p className="mt-1 text-[12px] text-slate-400">{p.comment||"-"}</p></div><div className="text-[13px] font-semibold text-slate-600">{p.debt?.client?.phone||"-"}</div><div className="text-[13px] font-semibold text-slate-500">{p.method||"-"}</div><div className="text-right text-[14px] font-bold text-slate-950">{money(p.amount,p.currency)}</div><div className="text-right text-[12px] font-semibold text-slate-400">{p.createdAt?new Date(p.createdAt).toLocaleString():"-"}</div></div>)}</div></div></AppLayout>
}
