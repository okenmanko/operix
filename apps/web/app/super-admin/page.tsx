"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CreditCard, Plus, RefreshCw, Save, Search, XCircle } from "lucide-react";
import SuperAdminShell from "./SuperAdminShell";
import { apiJson } from "../lib/api";
import { formatDate, formatLimit, formatUZS, moduleCodes, moduleLabels, normalizeModules, type CompanyStatus, type ModuleCode } from "../lib/modules";

type Plan = {
  id: string;
  code: string;
  name: string;
  monthlyPriceUZS: number;
  modules: ModuleCode[];
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
};

type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status: CompanyStatus;
  subscriptionPlan?: string;
  enabledModules?: ModuleCode[];
  monthlyPriceUZS?: number | null;
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
  lastPaymentAt?: string | null;
  nextPaymentAt?: string | null;
  paymentDay?: number | null;
  plan?: Plan | null;
  planPayments?: any[];
  _count?: { users?: number; clients?: number; products?: number; warehouses?: number };
};

const statuses: CompanyStatus[] = ["TRIAL", "ACTIVE", "BLOCKED", "EXPIRED"];

const emptyForm = {
  name: "",
  phone: "",
  ownerName: "",
  ownerPhone: "",
  ownerPassword: "",
  status: "TRIAL" as CompanyStatus,
  planId: "",
  enabledModules: [] as ModuleCode[],
  monthlyPriceUZS: 0,
  clientLimit: "",
  userLimit: "",
  productLimit: "",
  warehouseLimit: "",
  lastPaymentAt: "",
  nextPaymentAt: "",
  paymentDay: "",
};

function limitInput(value: string) {
  return value.trim().toLowerCase() === "unlimited" ? "" : value;
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [planData, companyData] = await Promise.all([
        apiJson<Plan[]>("/super-admin/plans"),
        apiJson<Company[]>("/super-admin/companies"),
      ]);
      setPlans(Array.isArray(planData) ? planData : []);
      setCompanies(Array.isArray(companyData) ? companyData : []);
    } catch (err: any) {
      setMessage(err.message || "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return companies;
    return companies.filter((c) => `${c.name} ${c.phone || ""} ${c.subscriptionPlan || ""}`.toLowerCase().includes(term));
  }, [companies, query]);

  const totals = useMemo(() => ({
    all: companies.length,
    active: companies.filter((c) => c.status === "ACTIVE").length,
    trial: companies.filter((c) => c.status === "TRIAL").length,
    blocked: companies.filter((c) => c.status === "BLOCKED").length,
    monthly: companies.reduce((s, c) => s + Number(c.monthlyPriceUZS || c.plan?.monthlyPriceUZS || 0), 0),
  }), [companies]);

  function selectPlan(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      planId,
      enabledModules: plan?.modules || [],
      monthlyPriceUZS: plan?.monthlyPriceUZS || 0,
      clientLimit: plan?.clientLimit == null ? "" : String(plan.clientLimit),
      userLimit: plan?.userLimit == null ? "" : String(plan.userLimit),
      productLimit: plan?.productLimit == null ? "" : String(plan.productLimit),
      warehouseLimit: plan?.warehouseLimit == null ? "" : String(plan.warehouseLimit),
    }));
  }

  function toggleModule(code: ModuleCode) {
    setForm((prev) => ({
      ...prev,
      enabledModules: prev.enabledModules.includes(code)
        ? prev.enabledModules.filter((item) => item !== code)
        : [...prev.enabledModules, code],
    }));
  }

  function openCreate() {
    setEditing(null);
    const firstPlan = plans.find((p) => p.code === "START") || plans[0];
    setForm({ ...emptyForm, planId: firstPlan?.id || "" });
    setOpen(true);
    setTimeout(() => firstPlan && selectPlan(firstPlan.id), 0);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({
      name: company.name || "",
      phone: company.phone || "",
      ownerName: "",
      ownerPhone: "",
      ownerPassword: "",
      status: company.status || "TRIAL",
      planId: company.plan?.id || "",
      enabledModules: normalizeModules(company.enabledModules),
      monthlyPriceUZS: Number(company.monthlyPriceUZS || company.plan?.monthlyPriceUZS || 0),
      clientLimit: company.clientLimit == null ? "" : String(company.clientLimit),
      userLimit: company.userLimit == null ? "" : String(company.userLimit),
      productLimit: company.productLimit == null ? "" : String(company.productLimit),
      warehouseLimit: company.warehouseLimit == null ? "" : String(company.warehouseLimit),
      lastPaymentAt: company.lastPaymentAt ? company.lastPaymentAt.slice(0, 10) : "",
      nextPaymentAt: company.nextPaymentAt ? company.nextPaymentAt.slice(0, 10) : "",
      paymentDay: company.paymentDay ? String(company.paymentDay) : "",
    });
    setOpen(true);
  }

  async function saveCompany() {
    setMessage("");
    const body = {
      name: form.name,
      phone: form.phone || null,
      status: form.status,
      planId: form.planId || null,
      enabledModules: form.enabledModules,
      monthlyPriceUZS: Number(form.monthlyPriceUZS || 0),
      clientLimit: limitInput(form.clientLimit),
      userLimit: limitInput(form.userLimit),
      productLimit: limitInput(form.productLimit),
      warehouseLimit: limitInput(form.warehouseLimit),
      lastPaymentAt: form.lastPaymentAt || null,
      nextPaymentAt: form.nextPaymentAt || null,
      paymentDay: form.paymentDay || null,
    };

    if (editing) {
      await apiJson(`/super-admin/companies/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setMessage("Kompaniya yangilandi");
    } else {
      await apiJson("/super-admin/companies", {
        method: "POST",
        body: JSON.stringify({ ...body, ownerName: form.ownerName, ownerPhone: form.ownerPhone, ownerPassword: form.ownerPassword }),
      });
      setMessage("Kompaniya yaratildi");
    }

    setOpen(false);
    await load();
  }

  async function addPayment(company: Company) {
    const amount = prompt("To‘lov summasi UZS", String(company.monthlyPriceUZS || company.plan?.monthlyPriceUZS || 0));
    if (!amount) return;
    const next = prompt("Keyingi to‘lov sanasi YYYY-MM-DD", company.nextPaymentAt?.slice(0, 10) || "");
    await apiJson(`/super-admin/companies/${company.id}/payments`, {
      method: "POST",
      body: JSON.stringify({ amountUZS: Number(amount), periodTo: next || null, method: "CASH" }),
    });
    await load();
  }

  return (
    <SuperAdminShell title="Kompaniyalar" subtitle="Tarif, modul, limit, status va oylik to‘lovlarni boshqarish">
      <div className="mb-5 grid grid-cols-5 gap-4">
        <Metric title="Jami" value={totals.all} />
        <Metric title="Active" value={totals.active} />
        <Metric title="Trial" value={totals.trial} />
        <Metric title="Blocked" value={totals.blocked} />
        <Metric title="MRR" value={formatUZS(totals.monthly)} />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-[420px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kompaniya qidirish..." className="w-full bg-transparent text-sm font-semibold outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} className="mr-2 inline" />Yangilash</button>
            <button onClick={openCreate} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white hover:bg-sky-600"><Plus size={17} className="mr-2 inline" />Kompaniya yaratish</button>
          </div>
        </div>

        {message ? <div className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">{message}</div> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="grid grid-cols-[1.35fr_0.8fr_1.3fr_1fr_1fr_160px] bg-slate-50 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
            <span>Kompaniya</span><span>Status</span><span>Plan / Modullar</span><span>Limitlar</span><span>To‘lov</span><span className="text-right">Amal</span>
          </div>
          {loading ? <div className="p-6 text-sm font-semibold text-slate-400">Yuklanmoqda...</div> : filtered.map((c) => {
            const modules = normalizeModules(c.enabledModules);
            return (
              <div key={c.id} className="grid grid-cols-[1.35fr_0.8fr_1.3fr_1fr_1fr_160px] items-center border-t border-slate-100 px-5 py-4">
                <div>
                  <p className="text-[15px] font-bold text-slate-950">{c.name}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">{c.phone || "Telefon yo‘q"}</p>
                </div>
                <StatusBadge status={c.status} />
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{c.plan?.name || c.subscriptionPlan || "Custom"}</p>
                  <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-400">{modules.slice(0, 5).map((m) => moduleLabels[m]?.uz || m).join(" • ")}</p>
                </div>
                <div className="text-[12px] font-bold leading-6 text-slate-500">
                  <p>Client: {c._count?.clients || 0}/{formatLimit(c.clientLimit)}</p>
                  <p>User: {c._count?.users || 0}/{formatLimit(c.userLimit)}</p>
                </div>
                <div className="text-[12px] font-bold leading-6 text-slate-500">
                  <p>{formatUZS(c.monthlyPriceUZS || c.plan?.monthlyPriceUZS)}</p>
                  <p>Next: {formatDate(c.nextPaymentAt)}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => addPayment(c)} className="rounded-xl border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50"><CreditCard size={16} /></button>
                  <button onClick={() => openEdit(c)} className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50">Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[1040px] overflow-auto rounded-[30px] bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-[26px] font-bold tracking-[-0.04em]">{editing ? "Kompaniyani tahrirlash" : "Yangi kompaniya"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">Plan, modul va limitlarni bitta oynada boshqarasiz</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 p-3 text-slate-500"><XCircle size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Field label="Kompaniya nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Kompaniya telefoni" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              {!editing ? <Field label="Owner ismi" value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} /> : null}
              {!editing ? <Field label="Owner telefoni" value={form.ownerPhone} onChange={(v) => setForm({ ...form, ownerPhone: v })} /> : null}
              {!editing ? <Field label="Owner paroli" value={form.ownerPassword} onChange={(v) => setForm({ ...form, ownerPassword: v })} /> : null}

              <label className="block">
                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CompanyStatus })} className="h-13 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">Tarif</span>
                <select value={form.planId} onChange={(e) => selectPlan(e.target.value)} className="h-13 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">
                  <option value="">Custom</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatUZS(p.monthlyPriceUZS)}</option>)}
                </select>
              </label>

              <Field label="Oylik narx UZS" type="number" value={String(form.monthlyPriceUZS)} onChange={(v) => setForm({ ...form, monthlyPriceUZS: Number(v) })} />
              <Field label="Client limit" value={form.clientLimit} placeholder="bo‘sh = unlimited" onChange={(v) => setForm({ ...form, clientLimit: v })} />
              <Field label="User limit" value={form.userLimit} placeholder="bo‘sh = unlimited" onChange={(v) => setForm({ ...form, userLimit: v })} />
              <Field label="Product limit" value={form.productLimit} placeholder="bo‘sh = unlimited" onChange={(v) => setForm({ ...form, productLimit: v })} />
              <Field label="Warehouse limit" value={form.warehouseLimit} placeholder="bo‘sh = unlimited" onChange={(v) => setForm({ ...form, warehouseLimit: v })} />
              <Field label="Payment day" value={form.paymentDay} placeholder="masalan 5" onChange={(v) => setForm({ ...form, paymentDay: v })} />
              <Field label="Oxirgi to‘lov" type="date" value={form.lastPaymentAt} onChange={(v) => setForm({ ...form, lastPaymentAt: v })} />
              <Field label="Keyingi to‘lov" type="date" value={form.nextPaymentAt} onChange={(v) => setForm({ ...form, nextPaymentAt: v })} />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">Modullar</p>
              <div className="grid grid-cols-3 gap-3">
                {moduleCodes.map((code) => {
                  const active = form.enabledModules.includes(code);
                  return (
                    <button key={code} onClick={() => toggleModule(code)} className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900">{active ? <CheckCircle2 size={16} className="text-sky-600" /> : null}{moduleLabels[code].uz}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">{moduleLabels[code].desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Bekor qilish</button>
              <button onClick={saveCompany} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white hover:bg-sky-600"><Save size={16} className="mr-2 inline" />Saqlash</button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
}

function Metric({ title, value }: { title: string; value: any }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</p><p className="mt-3 text-[25px] font-bold tracking-[-0.04em] text-slate-950">{value}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : status === "BLOCKED" ? "bg-red-50 text-red-700" : status === "EXPIRED" ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700";
  return <span className={`w-fit rounded-full px-3 py-1.5 text-[11px] font-bold ${cls}`}>{status}</span>;
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-13 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50" /></label>;
}
