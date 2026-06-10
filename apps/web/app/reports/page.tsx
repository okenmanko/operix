"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Payment = { id:string; amount:number; currency:string; method?:string|null; createdAt?:string; debt?:{client?:{fullName?:string;phone?:string}|null}|null };
type Debt = { id:string; amount:number; currency:string; status:string; dueDate?:string|null };

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

function isToday(date?:string|null){ if(!date)return false; const d=new Date(date),n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();}
function isOverdue(d:Debt){ if(!d.dueDate||d.status==="CLOSED")return false; const due=new Date(d.dueDate); due.setHours(23,59,59,999); return due.getTime()<Date.now();}
export default function ReportsPage(){
 const [payments,setPayments]=useState<Payment[]>([]); const [debts,setDebts]=useState<Debt[]>([]);
 async function load(){ try{const [p,d]=await Promise.all([apiJson<any>("/payments"),apiJson<any>("/debts")]); setPayments(toArray<Payment>(p)); setDebts(toArray<Debt>(d));}catch{setPayments([]);setDebts([]);}}
 useEffect(()=>{load();},[]);
 const safePayments=Array.isArray(payments)?payments:[]; const safeDebts=Array.isArray(debts)?debts:[];
 const report=useMemo(()=>{ const today=safePayments.filter(p=>isToday(p.createdAt)); const active=safeDebts.filter(d=>d.status!=="CLOSED"); const sumP=(l:Payment[],c:string)=>l.filter(p=>p.currency===c).reduce((s,p)=>s+Number(p.amount||0),0); const sumD=(l:Debt[],c:string)=>l.filter(d=>d.currency===c).reduce((s,d)=>s+Number(d.amount||0),0); return {todayUZS:sumP(today,"UZS"),todayUSD:sumP(today,"USD"),allUZS:sumP(safePayments,"UZS"),allUSD:sumP(safePayments,"USD"),debtUZS:sumD(active,"UZS"),debtUSD:sumD(active,"USD"),overdue:safeDebts.filter(isOverdue).length,payments:safePayments.length};},[safePayments,safeDebts]);
 const cards=[["Bugungi UZS",money(report.todayUZS,"UZS")],["Bugungi USD",money(report.todayUSD,"USD")],["Jami UZS",money(report.allUZS,"UZS")],["Jami USD",money(report.allUSD,"USD")],["Faol qarz UZS",money(report.debtUZS,"UZS")],["Faol qarz USD",money(report.debtUSD,"USD")],["Kechikkanlar",report.overdue],["To‘lovlar",report.payments]];
 return <AppLayout title="Hisobotlar" subtitle="To‘lovlar va qarzlar hisoboti"><div className="grid grid-cols-4 gap-4">{cards.map(([l,v])=><div key={String(l)} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><p className="text-[13px] font-semibold text-slate-500">{l}</p><p className="mt-8 text-[22px] font-semibold tracking-[-0.05em] text-slate-950">{v}</p></div>)}</div><div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Oxirgi to‘lovlar</h2><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="grid grid-cols-[1fr_150px_150px_150px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400"><div>Mijoz</div><div>Usul</div><div className="text-right">Summa</div><div className="text-right">Sana</div></div>{safePayments.length===0?<div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>:safePayments.slice(0,20).map(p=><div key={p.id} className="grid grid-cols-[1fr_150px_150px_150px] items-center border-t border-slate-100 px-4 py-4"><div><p className="text-[14px] font-bold text-slate-950">{p.debt?.client?.fullName||"-"}</p><p className="mt-1 text-[12px] text-slate-400">{p.debt?.client?.phone||"-"}</p></div><div className="text-[13px] font-semibold text-slate-500">{p.method||"-"}</div><div className="text-right text-[14px] font-bold text-slate-950">{money(p.amount,p.currency)}</div><div className="text-right text-[12px] font-semibold text-slate-400">{p.createdAt?new Date(p.createdAt).toLocaleDateString():"-"}</div></div>)}</div></div></AppLayout>
}
