"use client";

import { useEffect, useMemo, useState } from "react";
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
] as const;

const STATUSES = ["TRIAL", "ACTIVE", "BLOCKED"] as const;
const PLANS = ["STARTER", "SHOP", "BUSINESS", "PRO"] as const;

type ModuleCode = (typeof MODULES)[number];

type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status: string;
  subscriptionPlan: string;
  enabledModules: string[];
  clientLimit?: number | null;
  userLimit?: number | null;
  productLimit?: number | null;
  warehouseLimit?: number | null;
  monthlyPriceUZS?: number | null;
};

type CompanyForm = {
  companyName: string;
  companyPhone: string;
  fullName: string;
  phone: string;
  password: string;
  status: string;
  subscriptionPlan: string;
  monthlyPriceUZS: number;
  clientLimit: number;
  userLimit: number;
  productLimit: number;
  warehouseLimit: number;
  enabledModules: string[];
};

const emptyForm: CompanyForm = {
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
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [selected, setSelected] = useState<Company | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    return {
      all: companies.length,
      active: companies.filter((company: Company) => company.status === "ACTIVE").length,
      trial: companies.filter((company: Company) => company.status === "TRIAL").length,
      blocked: companies.filter((company: Company) => company.status === "BLOCKED").length,
    };
  }, [companies]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await apiJson<Company[]>("/super-admin/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleCreateModule(module: string) {
    setForm((current: CompanyForm) => ({
      ...current,
      enabledModules: current.enabledModules.includes(module)
        ? current.enabledModules.filter((item: string) => item !== module)
        : [...current.enabledModules, module],
    }));
  }

  function toggleSelectedModule(module: string) {
    setSelected((current: Company | null) => {
      if (!current) return current;

      const enabledModules = current.enabledModules || [];

      return {
        ...current,
        enabledModules: enabledModules.includes(module)
          ? enabledModules.filter((item: string) => item !== module)
          : [...enabledModules, module],
      };
    });
  }

  async function createCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      await apiJson("/super-admin/companies", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kompaniya yaratishda xatolik");
    }
  }

  async function updateCompany() {
    if (!selected) return;

    try {
      setError("");
      await apiJson(`/super-admin/companies/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(selected),
      });

      setSelected(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kompaniya yangilashda xatolik");
    }
  }

  return (
    <SuperAdminLayout>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-normal tracking-[-0.045em] text-[#111827]">
            Kompaniyalar
          </h1>
          <p className="mt-2 text-[15px] font-normal leading-6 text-[#6d7b90]">
            Tarif, status, modul va limitlarni bir joydan boshqarish.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((current: boolean) => !current)}
          className="h-12 rounded-[18px] bg-[#2f6df6] px-5 text-[14px] font-normal text-white shadow-[0_14px_30px_rgba(47,109,246,0.14)] transition hover:bg-[#255fe0]"
        >
          + Kompaniya qo‘shish
        </button>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard label="Jami" value={stats.all} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Trial" value={stats.trial} />
        <StatCard label="Blocked" value={stats.blocked} />
      </div>

      {error && (
        <div className="mb-5 rounded-[20px] border border-[#f2d5d5] bg-[#fff7f7] px-5 py-4 text-[14px] font-normal text-[#b42318]">
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={createCompany}
          className="mb-6 rounded-[28px] border border-[#e7edf5] bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.035)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-normal tracking-[-0.035em] text-[#111827]">
                Yangi kompaniya
              </h2>
              <p className="mt-1 text-[13px] font-normal text-[#7d8ca2]">
                Owner user bilan birga kompaniya ochiladi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="h-10 rounded-[14px] bg-[#f5f7fa] px-4 text-[13px] font-normal text-[#637083] transition hover:bg-[#eef3f8]"
            >
              Yopish
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Input label="Kompaniya" value={form.companyName} onChange={(value: string) => setForm({ ...form, companyName: value })} />
            <Input label="Kompaniya tel" value={form.companyPhone} onChange={(value: string) => setForm({ ...form, companyPhone: value })} />
            <Input label="Owner ism" value={form.fullName} onChange={(value: string) => setForm({ ...form, fullName: value })} />
            <Input label="Owner tel" value={form.phone} onChange={(value: string) => setForm({ ...form, phone: value })} />
            <Input label="Parol" value={form.password} onChange={(value: string) => setForm({ ...form, password: value })} />
            <Select label="Status" value={form.status} options={STATUSES} onChange={(value: string) => setForm({ ...form, status: value })} />
            <Select label="Plan" value={form.subscriptionPlan} options={PLANS} onChange={(value: string) => setForm({ ...form, subscriptionPlan: value })} />
            <Input label="Oylik narx" type="number" value={form.monthlyPriceUZS} onChange={(value: string) => setForm({ ...form, monthlyPriceUZS: Number(value) })} />
            <Input label="Client limit" type="number" value={form.clientLimit} onChange={(value: string) => setForm({ ...form, clientLimit: Number(value) })} />
            <Input label="User limit" type="number" value={form.userLimit} onChange={(value: string) => setForm({ ...form, userLimit: Number(value) })} />
            <Input label="Product limit" type="number" value={form.productLimit} onChange={(value: string) => setForm({ ...form, productLimit: Number(value) })} />
            <Input label="Warehouse limit" type="number" value={form.warehouseLimit} onChange={(value: string) => setForm({ ...form, warehouseLimit: Number(value) })} />
          </div>

          <ModulePicker selected={form.enabledModules} onToggle={toggleCreateModule} />

          <button className="mt-6 h-12 rounded-[18px] bg-[#2f6df6] px-8 text-[14px] font-normal text-white shadow-[0_14px_30px_rgba(47,109,246,0.14)] transition hover:bg-[#255fe0]">
            Saqlash
          </button>
        </form>
      )}

      <div className="rounded-[28px] border border-[#e7edf5] bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.035)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-normal tracking-[-0.035em] text-[#111827]">
            Ro‘yxat
          </h2>
          <span className="text-[13px] font-normal text-[#8190a5]">
            {loading ? "Yuklanmoqda..." : `${companies.length} ta kompaniya`}
          </span>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
              <tr>
                <th className="p-4">Kompaniya</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Limit</th>
                <th className="p-4">Narx</th>
                <th className="p-4 text-right">Amal</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company: Company) => (
                <tr key={company.id} className="border-t border-[#edf2f7]">
                  <td className="p-4 font-normal text-[#111827]">{company.name}</td>
                  <td className="p-4"><Badge>{company.subscriptionPlan}</Badge></td>
                  <td className="p-4"><StatusBadge status={company.status} /></td>
                  <td className="p-4 font-normal text-[#64748b]">
                    C:{company.clientLimit || "∞"} U:{company.userLimit || "∞"} P:{company.productLimit || "∞"}
                  </td>
                  <td className="p-4 font-normal text-[#64748b]">
                    {money(company.monthlyPriceUZS)} so‘m
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelected(company)}
                      className="h-10 rounded-[14px] bg-[#f4f7fb] px-4 text-[13px] font-normal text-[#334155] transition hover:bg-[#eef4ff] hover:text-[#255fe0]"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {companies.length === 0 && (
                <tr>
                  <td className="p-6 text-[#8aa0ba]" colSpan={6}>
                    Kompaniya yo‘q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/20 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[880px] rounded-[30px] bg-white p-7 shadow-[0_32px_90px_rgba(15,23,42,0.18)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[26px] font-normal tracking-[-0.045em] text-[#111827]">
                  Kompaniya edit
                </h2>
                <p className="mt-1 text-[13px] font-normal text-[#7d8ca2]">
                  Status, plan, limit va modullarni yangilash.
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="h-10 rounded-[14px] bg-[#f5f7fa] px-4 text-[13px] font-normal text-[#637083] transition hover:bg-[#eef3f8]"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Nomi" value={selected.name} onChange={(value: string) => setSelected({ ...selected, name: value })} />
              <Select label="Status" value={selected.status} options={STATUSES} onChange={(value: string) => setSelected({ ...selected, status: value })} />
              <Select label="Plan" value={selected.subscriptionPlan} options={PLANS} onChange={(value: string) => setSelected({ ...selected, subscriptionPlan: value })} />
              <Input label="Client limit" type="number" value={selected.clientLimit || 0} onChange={(value: string) => setSelected({ ...selected, clientLimit: Number(value) })} />
              <Input label="User limit" type="number" value={selected.userLimit || 0} onChange={(value: string) => setSelected({ ...selected, userLimit: Number(value) })} />
              <Input label="Product limit" type="number" value={selected.productLimit || 0} onChange={(value: string) => setSelected({ ...selected, productLimit: Number(value) })} />
            </div>

            <ModulePicker selected={selected.enabledModules || []} onToggle={toggleSelectedModule} />

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="h-12 rounded-[18px] bg-[#f5f7fa] px-6 text-[14px] font-normal text-[#52637a] transition hover:bg-[#eef3f8]"
              >
                Bekor
              </button>

              <button
                onClick={updateCompany}
                className="h-12 rounded-[18px] bg-[#2f6df6] px-7 text-[14px] font-normal text-white shadow-[0_14px_30px_rgba(47,109,246,0.14)] transition hover:bg-[#255fe0]"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-[#e7edf5] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.03)]">
      <p className="text-[12px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-normal tracking-[-0.045em] text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className="h-12 w-full rounded-[18px] border border-[#dfe8f3] bg-white px-4 text-[14px] font-normal outline-none transition focus:border-[#9ec5fe] focus:ring-4 focus:ring-[#eef5ff]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className="h-12 w-full rounded-[18px] border border-[#dfe8f3] bg-white px-4 text-[14px] font-normal outline-none transition focus:border-[#9ec5fe] focus:ring-4 focus:ring-[#eef5ff]"
      >
        {options.map((option: string) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ModulePicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (module: string) => void;
}) {
  return (
    <div className="mt-6 rounded-[24px] border border-[#edf2f7] bg-[#fbfdff] p-5">
      <p className="mb-4 text-[13px] font-normal uppercase tracking-[0.12em] text-[#8aa0ba]">
        Modullar
      </p>

      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((module: ModuleCode) => {
          const active = selected.includes(module);

          return (
            <button
              type="button"
              key={module}
              onClick={() => onToggle(module)}
              className={`flex h-[64px] items-center justify-center rounded-[20px] px-4 text-[15px] font-normal tracking-[-0.01em] transition ${
                active
                  ? "border border-[#b8ccff] bg-[#eef4ff] text-[#315efb] shadow-[0_10px_24px_rgba(49,94,251,0.10)]"
                  : "border border-[#e6edf5] bg-white text-[#617186] hover:border-[#cddcf0] hover:bg-[#f5f9ff] hover:text-[#315efb]"
              }`}
            >
              {module}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[12px] font-normal text-[#315efb]">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-[#ecfdf5] text-[#047857]"
      : status === "TRIAL"
        ? "bg-[#fffbeb] text-[#b45309]"
        : "bg-[#f8fafc] text-[#64748b]";

  return (
    <span className={`rounded-full px-3 py-1.5 text-[12px] font-normal ${className}`}>
      {status}
    </span>
  );
}
