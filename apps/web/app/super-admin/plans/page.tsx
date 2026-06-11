"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import SuperAdminShell from "../SuperAdminShell";
import { apiJson } from "../../lib/api";
import { formatLimit, formatUZS, moduleCodes, moduleLabels, normalizeModules, type ModuleCode } from "../../lib/modules";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  monthlyPriceUZS: number;
  modules: ModuleCode[];
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
};

const emptyForm = {
  code: "",
  name: "",
  description: "",
  monthlyPriceUZS: 0,
  modules: [] as ModuleCode[],
  clientLimit: "",
  userLimit: "",
  productLimit: "",
  warehouseLimit: "",
  isActive: true,
  sortOrder: 99,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiJson<Plan[]>("/super-admin/plans");
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage(err.message || "Tariflarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  async function seedDefaults() {
    await apiJson("/super-admin/plans/seed-defaults", { method: "POST", body: JSON.stringify({}) });
    setMessage("Standart tariflar tiklandi");
    await load();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      monthlyPriceUZS: plan.monthlyPriceUZS || 0,
      modules: normalizeModules(plan.modules),
      clientLimit: plan.clientLimit == null ? "" : String(plan.clientLimit),
      userLimit: plan.userLimit == null ? "" : String(plan.userLimit),
      productLimit: plan.productLimit == null ? "" : String(plan.productLimit),
      warehouseLimit: plan.warehouseLimit == null ? "" : String(plan.warehouseLimit),
      isActive: plan.isActive,
      sortOrder: plan.sortOrder || 99,
    });
  }

  function toggleModule(code: ModuleCode) {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(code) ? prev.modules.filter((m) => m !== code) : [...prev.modules, code],
    }));
  }

  async function savePlan() {
    const body = {
      ...form,
      clientLimit: form.clientLimit,
      userLimit: form.userLimit,
      productLimit: form.productLimit,
      warehouseLimit: form.warehouseLimit,
    };

    if (editing) {
      await apiJson(`/super-admin/plans/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setMessage("Tarif yangilandi");
    } else {
      await apiJson("/super-admin/plans", { method: "POST", body: JSON.stringify(body) });
      setMessage("Tarif yaratildi");
    }

    setEditing(null);
    setForm(emptyForm);
    await load();
  }

  async function removePlan(plan: Plan) {
    if (!confirm(`${plan.name} tarifini o‘chiramizmi?`)) return;
    await apiJson(`/super-admin/plans/${plan.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <SuperAdminShell title="Tariflar" subtitle="O‘zbekiston bozori uchun planlar, modullar, limitlar va narxlar">
      <div className="mb-5 flex justify-between gap-4">
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">Tariflar soni</p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.05em]">{plans.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={seedDefaults} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} className="mr-2 inline" />Standartlarni tiklash</button>
          <button onClick={openCreate} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white hover:bg-sky-600"><Plus size={16} className="mr-2 inline" />Custom tarif</button>
        </div>
      </div>

      {message ? <div className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">{message}</div> : null}

      <div className="grid grid-cols-[1.35fr_0.9fr] gap-5">
        <div className="grid grid-cols-2 gap-5">
          {loading ? <div className="text-sm font-bold text-slate-400">Yuklanmoqda...</div> : plans.map((plan) => {
            const modules = normalizeModules(plan.modules);
            return (
              <button key={plan.id} onClick={() => openEdit(plan)} className="rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[26px] font-bold tracking-[-0.05em] text-slate-950">{plan.name}</p>
                    <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-sky-600">{plan.code}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{plan.isActive ? "ACTIVE" : "OFF"}</span>
                </div>
                <p className="mb-4 min-h-[40px] text-[13px] font-semibold leading-6 text-slate-500">{plan.description || "—"}</p>
                <p className="mb-4 text-[22px] font-bold tracking-[-0.04em] text-slate-950">{formatUZS(plan.monthlyPriceUZS)} <span className="text-[13px] text-slate-400">/ oy</span></p>
                <div className="mb-4 grid grid-cols-2 gap-2 text-[12px] font-bold text-slate-500">
                  <p>Client: {formatLimit(plan.clientLimit)}</p>
                  <p>User: {formatLimit(plan.userLimit)}</p>
                  <p>Product: {formatLimit(plan.productLimit)}</p>
                  <p>Warehouse: {formatLimit(plan.warehouseLimit)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {modules.slice(0, 8).map((m) => <span key={m} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{moduleLabels[m]?.uz || m}</span>)}
                  {modules.length > 8 ? <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">+{modules.length - 8}</span> : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky top-8 h-fit rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.04em]">{editing ? "Tarifni tahrirlash" : "Yangi tarif"}</h2>
              <p className="mt-1 text-[12px] font-semibold text-slate-400">Narx, modul va limitlar</p>
            </div>
            {editing ? <button onClick={() => removePlan(editing)} className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button> : null}
          </div>

          <div className="space-y-3">
            <Field label="Kod" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="masalan SHOP_PLUS" />
            <Field label="Nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Izoh" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <Field label="Narx UZS / oy" type="number" value={String(form.monthlyPriceUZS)} onChange={(v) => setForm({ ...form, monthlyPriceUZS: Number(v) })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Client" value={form.clientLimit} placeholder="bo‘sh=unlimited" onChange={(v) => setForm({ ...form, clientLimit: v })} />
              <Field label="User" value={form.userLimit} placeholder="bo‘sh=unlimited" onChange={(v) => setForm({ ...form, userLimit: v })} />
              <Field label="Product" value={form.productLimit} placeholder="bo‘sh=unlimited" onChange={(v) => setForm({ ...form, productLimit: v })} />
              <Field label="Warehouse" value={form.warehouseLimit} placeholder="bo‘sh=unlimited" onChange={(v) => setForm({ ...form, warehouseLimit: v })} />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
            </label>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">Modullar</p>
            <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
              {moduleCodes.map((code) => {
                const active = form.modules.includes(code);
                return (
                  <button key={code} onClick={() => toggleModule(code)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${active ? "border-sky-300 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <p className="text-[13px] font-bold text-slate-900">{moduleLabels[code].uz}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{moduleLabels[code].desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={savePlan} className="mt-5 w-full rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white hover:bg-sky-600"><Save size={16} className="mr-2 inline" />Saqlash</button>
        </div>
      </div>
    </SuperAdminShell>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50" /></label>;
}
