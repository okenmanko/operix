"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
import {
  formatPhone,
  moduleLabels,
  modulesForPlan,
  normalizeModules,
  plans,
  type CompanyStatus,
  type ModuleCode,
  type PlanCode,
} from "../lib/modules";

type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status?: CompanyStatus;
  subscriptionPlan?: PlanCode;
  enabledModules?: ModuleCode[] | string;
  createdAt?: string;
  _count?: { users?: number; clients?: number; debts?: number; payments?: number };
};

const statuses: CompanyStatus[] = ["TRIAL", "ACTIVE", "BLOCKED"];
const planCodes: PlanCode[] = ["STARTER", "BUSINESS", "PRO"];

const defaultForm = {
  companyName: "",
  companyPhone: "",
  ownerName: "",
  ownerPhone: "",
  ownerPassword: "",
  status: "TRIAL" as CompanyStatus,
  subscriptionPlan: "STARTER" as PlanCode,
  enabledModules: modulesForPlan("STARTER"),
};

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      const data = await apiJson<Company[]>("/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage(err.message || "Kompaniyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return companies;
    return companies.filter((company) => `${company.name} ${company.phone || ""}`.toLowerCase().includes(term));
  }, [companies, query]);

  function openCreate() {
    setForm(defaultForm);
    setCreateOpen(true);
    setMessage("");
  }

  function openEdit(company: Company) {
    setEditCompany(company);
    setForm({
      companyName: company.name,
      companyPhone: company.phone || "",
      ownerName: "",
      ownerPhone: "",
      ownerPassword: "",
      status: company.status || "TRIAL",
      subscriptionPlan: company.subscriptionPlan || "STARTER",
      enabledModules: normalizeModules(company.enabledModules).length
        ? normalizeModules(company.enabledModules)
        : modulesForPlan(company.subscriptionPlan),
    });
    setMessage("");
  }

  function changePlan(plan: PlanCode) {
    setForm((prev) => ({ ...prev, subscriptionPlan: plan, enabledModules: modulesForPlan(plan) }));
  }

  function toggleModule(module: ModuleCode) {
    setForm((prev) => {
      const has = prev.enabledModules.includes(module);
      return {
        ...prev,
        enabledModules: has ? prev.enabledModules.filter((item) => item !== module) : [...prev.enabledModules, module],
      };
    });
  }

  async function createCompany() {
    if (!form.companyName || !form.ownerName || !form.ownerPhone || !form.ownerPassword) {
      setMessage("Kompaniya nomi, owner ismi, telefon va parol majburiy");
      return;
    }

    await apiJson("/auth/create-company-owner", {
      method: "POST",
      body: JSON.stringify({
        companyName: form.companyName,
        companyPhone: form.companyPhone || undefined,
        fullName: form.ownerName,
        phone: form.ownerPhone,
        password: form.ownerPassword,
        status: form.status,
        subscriptionPlan: form.subscriptionPlan,
        enabledModules: form.enabledModules,
      }),
    });

    setCreateOpen(false);
    setMessage("Kompaniya yaratildi");
    await loadCompanies();
  }

  async function updateCompany() {
    if (!editCompany) return;
    await apiJson(`/companies/${editCompany.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: form.companyName,
        phone: form.companyPhone || null,
        status: form.status,
        subscriptionPlan: form.subscriptionPlan,
        enabledModules: form.enabledModules,
      }),
    });
    setEditCompany(null);
    setMessage("Kompaniya yangilandi");
    await loadCompanies();
  }

  async function quickStatus(company: Company, status: CompanyStatus) {
    await apiJson(`/companies/${company.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadCompanies();
  }

  async function deleteCompany(company: Company) {
    if (!confirm(`${company.name} o‘chirilsinmi?`)) return;
    await apiJson(`/companies/${company.id}`, { method: "DELETE" });
    await loadCompanies();
  }

  return (
    <AppLayout title="Super Admin" subtitle="Kompaniyalar, tariflar va modullar boshqaruvi">
      <div className="mb-5 grid grid-cols-4 gap-4">
        <Metric title="Kompaniyalar" value={companies.length} />
        <Metric title="Active" value={companies.filter((c) => c.status === "ACTIVE").length} />
        <Metric title="Trial" value={companies.filter((c) => c.status === "TRIAL").length} />
        <Metric title="Blocked" value={companies.filter((c) => c.status === "BLOCKED").length} />
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Kompaniyalar</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-400">Platformadagi barcha bizneslar va ulangan modullar</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600">
            <Plus size={17} /> Kompaniya qo‘shish
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <Search size={17} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=""
            className="w-full bg-transparent text-sm outline-none dark:text-white"
          />
        </div>

        {message && <div className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{message}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_130px] bg-slate-50 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:bg-slate-950">
            <span>Kompaniya</span>
            <span>Plan</span>
            <span>Modullar</span>
            <span>Status</span>
            <span className="text-right">Amal</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-400">Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">Kompaniya topilmadi</div>
          ) : (
            filtered.map((company) => {
              const modules = normalizeModules(company.enabledModules);
              return (
                <div key={company.id} className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_130px] items-center border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <button type="button" onClick={() => setDetailCompany(company)} className="text-left">
                    <p className="text-[15px] font-semibold text-slate-950 dark:text-white">{company.name}</p>
                    <p className="mt-1 text-[12px] font-medium text-slate-400">{company.phone || "Telefon kiritilmagan"}</p>
                  </button>

                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {plans[company.subscriptionPlan || "STARTER"]?.name || "Starter"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(modules.length ? modules : modulesForPlan(company.subscriptionPlan)).slice(0, 6).map((module) => (
                      <span key={module} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                        {moduleLabels[module]?.uz || module}
                      </span>
                    ))}
                  </div>

                  <select
                    value={company.status || "TRIAL"}
                    onChange={(e) => quickStatus(company, e.target.value as CompanyStatus)}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(company)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><Pencil size={16} /></button>
                    <button onClick={() => deleteCompany(company)} className="rounded-xl border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(createOpen || editCompany) && (
        <CompanyModal
          title={createOpen ? "Yangi kompaniya" : "Kompaniyani tahrirlash"}
          form={form}
          setForm={setForm}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onClose={() => {
            setCreateOpen(false);
            setEditCompany(null);
          }}
          onSave={createOpen ? createCompany : updateCompany}
          isEdit={Boolean(editCompany)}
          changePlan={changePlan}
          toggleModule={toggleModule}
        />
      )}

      {detailCompany && (
        <DetailModal company={detailCompany} onClose={() => setDetailCompany(null)} />
      )}
    </AppLayout>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[12px] font-semibold text-slate-400">{title}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function CompanyModal({ title, form, setForm, showPassword, setShowPassword, onClose, onSave, isEdit, changePlan, toggleModule }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[22px] font-semibold tracking-[-0.03em] dark:text-white">{title}</h3>
            <p className="mt-1 text-[13px] font-medium text-slate-400">Plan tanlanganda modullar avtomatik belgilanadi</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Kompaniya nomi" value={form.companyName} onChange={(v: string) => setForm((p: any) => ({ ...p, companyName: v }))} />
          <Input label="Kompaniya telefoni" value={form.companyPhone} onChange={(v: string) => setForm((p: any) => ({ ...p, companyPhone: formatPhone(v) }))} />
          {!isEdit && <Input label="Owner ismi" value={form.ownerName} onChange={(v: string) => setForm((p: any) => ({ ...p, ownerName: v }))} />}
          {!isEdit && <Input label="Owner telefoni" value={form.ownerPhone} onChange={(v: string) => setForm((p: any) => ({ ...p, ownerPhone: formatPhone(v) }))} />}
          {!isEdit && (
            <div>
              <label className="mb-2 block text-[12px] font-semibold text-slate-500">Owner paroli</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.ownerPassword} onChange={(e) => setForm((p: any) => ({ ...p, ownerPassword: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <button type="button" onClick={() => setShowPassword((v: boolean) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-slate-500">Status</label>
            <select value={form.status} onChange={(e) => setForm((p: any) => ({ ...p, status: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {planCodes.map((code) => (
            <button key={code} type="button" onClick={() => changePlan(code)} className={`rounded-2xl border p-4 text-left transition ${form.subscriptionPlan === code ? "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}>
              <p className="text-[15px] font-semibold dark:text-white">{plans[code].name}</p>
              <p className="mt-1 text-[12px] font-medium text-slate-400">{plans[code].subtitle}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {(Object.keys(moduleLabels) as ModuleCode[]).map((module) => (
            <button key={module} type="button" onClick={() => toggleModule(module)} className={`rounded-2xl border px-3 py-3 text-left text-[13px] font-semibold transition ${form.enabledModules.includes(module) ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"}`}>
              {moduleLabels[module].uz}
            </button>
          ))}
        </div>

        <button onClick={onSave} className="mt-6 w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600">Saqlash</button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-semibold text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
    </div>
  );
}

function DetailModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const modules = normalizeModules(company.enabledModules);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[24px] font-semibold tracking-[-0.04em] dark:text-white">{company.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{company.phone || "Telefon kiritilmagan"} • {company.status || "TRIAL"} • {company.subscriptionPlan || "STARTER"}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Metric title="Users" value={company._count?.users || 0} />
          <Metric title="Clients" value={company._count?.clients || 0} />
          <Metric title="Debts" value={company._count?.debts || 0} />
          <Metric title="Payments" value={company._count?.payments || 0} />
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="mb-3 text-[13px] font-semibold text-slate-500">Ulangan modullar</p>
          <div className="grid grid-cols-4 gap-2">
            {(modules.length ? modules : modulesForPlan(company.subscriptionPlan)).map((module) => (
              <div key={module} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[13px] font-semibold dark:text-white">{moduleLabels[module]?.uz || module}</p>
                <p className="mt-1 text-[11px] text-slate-400">{moduleLabels[module]?.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
