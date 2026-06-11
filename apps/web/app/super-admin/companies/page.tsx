"use client";

import { useEffect, useState } from "react";
import SuperAdminLayout from "../../components/SuperAdminLayout";
import { apiJson, money } from "../../lib/api";

const MODULES = [
  "CRM",
  "DEBTS",
  "PAYMENTS",
  "REPORTS",
  "INVENTORY",
  "WAREHOUSES",
  "QR",
  "STOCK",
  "DELIVERY",
  "DDS",
  "ANALYTICS",
  "POS",
  "HR",
  "KPI",
  "AI_DIRECTOR",
];

type Company = {
  id: string;
  name: string;
  phone?: string;
  status: string;
  subscriptionPlan: string;
  enabledModules: string[];
  clientLimit?: number;
  userLimit?: number;
  productLimit?: number;
  warehouseLimit?: number;
  monthlyPriceUZS?: number;
  users?: any[];
};

const emptyForm = {
  companyName: "",
  companyPhone: "",
  fullName: "",
  phone: "",
  password: "",
  status: "TRIAL",
  subscriptionPlan: "STARTER",
  monthlyPriceUZS: 0,
  clientLimit: 100,
  userLimit: 3,
  productLimit: 100,
  warehouseLimit: 1,
  enabledModules: ["CRM", "DEBTS", "PAYMENTS", "REPORTS"],
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [selected, setSelected] = useState<Company | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Company[]>("/super-admin/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleModule(module: string) {
    const list = form.enabledModules || [];
    setForm({
      ...form,
      enabledModules: list.includes(module)
        ? list.filter((x: string) => x !== module)
        : [...list, module],
    });
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    await apiJson("/super-admin/companies", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    await load();
  }

  async function updateCompany() {
    if (!selected) return;
    await apiJson(`/super-admin/companies/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify(selected),
    });
    setSelected(null);
    await load();
  }

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black">Kompaniyalar</h1>
        <p className="mt-3 text-base font-semibold text-slate-500">
          Tarif, status, modullar va limitlar boshqaruvi
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={createCompany}
        className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-5 text-2xl font-black">Yangi kompaniya</h2>

        <div className="grid grid-cols-4 gap-4">
          <Input label="Kompaniya" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
          <Input label="Kompaniya tel" value={form.companyPhone} onChange={(v) => setForm({ ...form, companyPhone: v })} />
          <Input label="Owner ism" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Input label="Owner tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Parol" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
          <Select label="Status" value={form.status} options={["TRIAL", "ACTIVE", "BLOCKED"]} onChange={(v) => setForm({ ...form, status: v })} />
          <Select label="Plan" value={form.subscriptionPlan} options={["STARTER", "SHOP", "BUSINESS", "PRO"]} onChange={(v) => setForm({ ...form, subscriptionPlan: v })} />
          <Input label="Oylik narx" type="number" value={form.monthlyPriceUZS} onChange={(v) => setForm({ ...form, monthlyPriceUZS: Number(v) })} />
          <Input label="Client limit" type="number" value={form.clientLimit} onChange={(v) => setForm({ ...form, clientLimit: Number(v) })} />
          <Input label="User limit" type="number" value={form.userLimit} onChange={(v) => setForm({ ...form, userLimit: Number(v) })} />
          <Input label="Product limit" type="number" value={form.productLimit} onChange={(v) => setForm({ ...form, productLimit: Number(v) })} />
          <Input label="Warehouse limit" type="number" value={form.warehouseLimit} onChange={(v) => setForm({ ...form, warehouseLimit: Number(v) })} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => toggleModule(m)}
              className={`rounded-full px-4 py-2 text-xs font-black ${
                form.enabledModules.includes(m)
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button className="mt-6 h-12 rounded-2xl bg-slate-950 px-8 text-sm font-black text-white">
          Saqlash
        </button>
      </form>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-2xl font-black">Ro‘yxat</h2>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Kompaniya</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Limit</th>
                <th className="p-4">Narx</th>
                <th className="p-4">Amal</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-4 font-black">{c.name}</td>
                  <td className="p-4">{c.subscriptionPlan}</td>
                  <td className="p-4">{c.status}</td>
                  <td className="p-4">
                    C:{c.clientLimit || "∞"} U:{c.userLimit || "∞"} P:{c.productLimit || "∞"}
                  </td>
                  <td className="p-4">{money(c.monthlyPriceUZS)} so‘m</td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelected(c)}
                      className="rounded-xl bg-slate-100 px-4 py-2 font-black"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={6}>
                    Kompaniya yo‘q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="w-full max-w-4xl rounded-[28px] bg-white p-6">
            <h2 className="mb-5 text-2xl font-black">Kompaniya edit</h2>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Nomi" value={selected.name} onChange={(v) => setSelected({ ...selected, name: v })} />
              <Select label="Status" value={selected.status} options={["TRIAL", "ACTIVE", "BLOCKED"]} onChange={(v) => setSelected({ ...selected, status: v })} />
              <Select label="Plan" value={selected.subscriptionPlan} options={["STARTER", "SHOP", "BUSINESS", "PRO"]} onChange={(v) => setSelected({ ...selected, subscriptionPlan: v })} />
              <Input label="Client limit" type="number" value={selected.clientLimit || 0} onChange={(v) => setSelected({ ...selected, clientLimit: Number(v) })} />
              <Input label="User limit" type="number" value={selected.userLimit || 0} onChange={(v) => setSelected({ ...selected, userLimit: Number(v) })} />
              <Input label="Product limit" type="number" value={selected.productLimit || 0} onChange={(v) => setSelected({ ...selected, productLimit: Number(v) })} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {MODULES.map((m) => {
                const list = selected.enabledModules || [];
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() =>
                      setSelected({
                        ...selected,
                        enabledModules: list.includes(m)
                          ? list.filter((x) => x !== m)
                          : [...list, m],
                      })
                    }
                    className={`rounded-full px-4 py-2 text-xs font-black ${
                      list.includes(m)
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="h-12 rounded-2xl bg-slate-100 px-6 font-black">
                Bekor
              </button>
              <button onClick={updateCompany} className="h-12 rounded-2xl bg-slate-950 px-6 font-black text-white">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-slate-950"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-slate-950"
      >
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
