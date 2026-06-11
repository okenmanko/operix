"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CircleDollarSign, Lock, LogOut, Plus, Search, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { apiJson, logout } from "../lib/api";

type Status = "TRIAL" | "ACTIVE" | "BLOCKED";
type Plan = "STARTER" | "BUSINESS" | "PRO" | "CUSTOM";
type Company = {
  id: string;
  name: string;
  phone?: string | null;
  status?: Status;
  subscriptionPlan?: string;
  enabledModules?: string[];
  trialEndsAt?: string | null;
  createdAt?: string;
  users?: Array<{ id: string; fullName: string; phone: string; role: string; isActive?: boolean }>;
  _stats?: { usersCount?: number; clientsCount?: number; debtsCount?: number; paymentsCount?: number };
  _count?: { users?: number; clients?: number };
};

const MODULES = [
  { code: "CRM", label: "CRM", desc: "Mijozlar, qarzlar, to‘lovlar" },
  { code: "DELIVERY", label: "Delivery", desc: "Yetkazib berish buyurtmalari" },
  { code: "INVENTORY", label: "Sklad", desc: "Sklad, QR, mahsulotlar" },
  { code: "POS", label: "POS/Sales", desc: "QR sotuv va kassaga tushum" },
  { code: "CASHFLOW", label: "DDS", desc: "Pul kirim/chiqim nazorati" },
  { code: "MOYSKLAD", label: "MoySklad", desc: "Integratsiya" },
  { code: "ONE_C", label: "1C", desc: "Buxgalteriya integratsiyasi" },
  { code: "ANALYTICS", label: "Analytics", desc: "Hisobot va grafiklar" },
  { code: "KPI", label: "KPI", desc: "Hodimlar samaradorligi" },
  { code: "AI_DIRECTOR", label: "AI Director", desc: "Rahbar uchun AI xulosa" },
];

const PLAN_PRESETS: Record<Plan, { label: string; price: number; clients: string; users: string; modules: string[] }> = {
  STARTER: { label: "Starter", price: 300000, clients: "100", users: "3", modules: ["CRM", "DELIVERY"] },
  BUSINESS: { label: "Business", price: 900000, clients: "2000", users: "15", modules: ["CRM", "DELIVERY", "INVENTORY", "POS", "CASHFLOW", "MOYSKLAD", "ANALYTICS"] },
  PRO: { label: "Pro", price: 1800000, clients: "UNLIMITED", users: "UNLIMITED", modules: MODULES.map((m) => m.code) },
  CUSTOM: { label: "Custom", price: 0, clients: "100", users: "3", modules: ["CRM"] },
};

const META_PREFIXES = ["LIMIT_CLIENTS_", "LIMIT_USERS_", "MONTHLY_PRICE_", "LAST_PAYMENT_", "NEXT_PAYMENT_"];

function cleanModules(modules?: string[]) {
  return (modules || []).filter((m) => !META_PREFIXES.some((p) => m.startsWith(p)));
}
function getMeta(modules: string[] | undefined, prefix: string, fallback = "") {
  return (modules || []).find((m) => m.startsWith(prefix))?.slice(prefix.length) || fallback;
}
function withMeta(modules: string[], form: FormState) {
  return [
    ...cleanModules(modules),
    `LIMIT_CLIENTS_${form.clientLimit || "UNLIMITED"}`,
    `LIMIT_USERS_${form.userLimit || "UNLIMITED"}`,
    `MONTHLY_PRICE_${String(form.monthlyPrice || 0)}`,
    ...(form.lastPaymentDate ? [`LAST_PAYMENT_${form.lastPaymentDate}`] : []),
    ...(form.nextPaymentDate ? [`NEXT_PAYMENT_${form.nextPaymentDate}`] : []),
  ];
}
function money(value: any) {
  const n = Number(value || 0);
  return `${new Intl.NumberFormat("ru-RU").format(n)} UZS`;
}
function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return digits ? `+998${digits}` : "";
}

type FormState = {
  companyName: string;
  companyPhone: string;
  ownerName: string;
  ownerPhone: string;
  ownerPassword: string;
  plan: Plan;
  status: Status;
  monthlyPrice: number;
  clientLimit: string;
  userLimit: string;
  lastPaymentDate: string;
  nextPaymentDate: string;
  modules: string[];
};

const emptyForm: FormState = {
  companyName: "",
  companyPhone: "",
  ownerName: "",
  ownerPhone: "",
  ownerPassword: "",
  plan: "STARTER",
  status: "TRIAL",
  monthlyPrice: PLAN_PRESETS.STARTER.price,
  clientLimit: PLAN_PRESETS.STARTER.clients,
  userLimit: PLAN_PRESETS.STARTER.users,
  lastPaymentDate: "",
  nextPaymentDate: todayPlus(30),
  modules: PLAN_PRESETS.STARTER.modules,
};

export default function SuperAdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("operix_user") || "{}");
      if (user?.role !== "SUPER_ADMIN") {
        window.location.href = "/";
        return;
      }
      setAllowed(true);
      loadCompanies();
    } finally {
      setChecking(false);
    }
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      setMessage("");
      const data = await apiJson<Company[]>("/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(e?.message || "Kompaniyalarni olishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      total: companies.length,
      active: companies.filter((c) => c.status === "ACTIVE").length,
      trial: companies.filter((c) => c.status === "TRIAL").length,
      blocked: companies.filter((c) => c.status === "BLOCKED").length,
    };
  }, [companies]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter((c) => `${c.name} ${c.phone || ""} ${c.subscriptionPlan || ""}`.toLowerCase().includes(q));
  }, [companies, query]);

  function applyPlan(plan: Plan) {
    const p = PLAN_PRESETS[plan];
    setForm((f) => ({ ...f, plan, monthlyPrice: p.price, clientLimit: p.clients, userLimit: p.users, modules: p.modules }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModal("create");
    setMessage("");
  }

  function openEdit(company: Company) {
    const modules = company.enabledModules || [];
    const plan = (company.subscriptionPlan || "STARTER") as Plan;
    setEditing(company);
    setForm({
      companyName: company.name,
      companyPhone: company.phone || "",
      ownerName: "",
      ownerPhone: "",
      ownerPassword: "",
      plan: ["STARTER", "BUSINESS", "PRO", "CUSTOM"].includes(plan) ? plan : "CUSTOM",
      status: company.status || "TRIAL",
      monthlyPrice: Number(getMeta(modules, "MONTHLY_PRICE_", String(PLAN_PRESETS.STARTER.price))),
      clientLimit: getMeta(modules, "LIMIT_CLIENTS_", PLAN_PRESETS.STARTER.clients),
      userLimit: getMeta(modules, "LIMIT_USERS_", PLAN_PRESETS.STARTER.users),
      lastPaymentDate: getMeta(modules, "LAST_PAYMENT_", ""),
      nextPaymentDate: getMeta(modules, "NEXT_PAYMENT_", ""),
      modules: cleanModules(modules).length ? cleanModules(modules) : PLAN_PRESETS.STARTER.modules,
    });
    setModal("edit");
  }

  function toggleModule(code: string) {
    setForm((f) => ({ ...f, modules: f.modules.includes(code) ? f.modules.filter((m) => m !== code) : [...f.modules, code] }));
  }

  async function save() {
    try {
      setLoading(true);
      setMessage("");
      const enabledModules = withMeta(form.modules, form);
      if (modal === "create") {
        if (!form.companyName || !form.ownerName || !form.ownerPhone || !form.ownerPassword) {
          setMessage("Kompaniya, owner ismi, telefon va parol majburiy");
          return;
        }
        await apiJson("/auth/create-company-owner", {
          method: "POST",
          body: JSON.stringify({
            companyName: form.companyName,
            companyPhone: form.companyPhone || undefined,
            fullName: form.ownerName,
            phone: formatPhone(form.ownerPhone),
            password: form.ownerPassword,
            status: form.status,
            subscriptionPlan: form.plan,
            enabledModules,
          }),
        });
      } else if (editing) {
        await apiJson(`/companies/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.companyName,
            phone: form.companyPhone || null,
            status: form.status,
            subscriptionPlan: form.plan,
            enabledModules,
          }),
        });
      }
      setModal(null);
      await loadCompanies();
    } catch (e: any) {
      setMessage(e?.message || "Saqlashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  async function quickStatus(company: Company, status: Status) {
    await apiJson(`/companies/${company.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadCompanies();
  }

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Tekshirilmoqda...</div>;
  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-8 py-7 text-slate-950">
      <header className="mb-8 flex items-start justify-between gap-5">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"><ShieldCheck size={17}/> Operix Super Admin</div>
          <h1 className="text-[42px] font-black tracking-[-0.06em]">Platforma boshqaruvi</h1>
          <p className="mt-2 text-[15px] font-semibold text-slate-500">Kompaniyalar, tariflar, modullar, limitlar va oylik to‘lov nazorati.</p>
        </div>
        <button onClick={logout} className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50"><LogOut className="mr-2 inline" size={17}/> Chiqish</button>
      </header>

      <section className="grid grid-cols-4 gap-4">
        <Stat title="Kompaniyalar" value={stats.total} icon={<Building2/>}/>
        <Stat title="Active" value={stats.active} icon={<CheckCircle2/>}/>
        <Stat title="Trial" value={stats.trial} icon={<CircleDollarSign/>}/>
        <Stat title="Blocked" value={stats.blocked} icon={<Lock/>}/>
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em]">Kompaniyalar</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">Har bir kompaniyaga alohida plan, modul va limit belgilanadi.</p>
          </div>
          <button onClick={openCreate} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"><Plus className="mr-2 inline" size={17}/> Kompaniya qo‘shish</button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kompaniya, telefon yoki plan bo‘yicha qidirish" className="w-full bg-transparent text-sm font-semibold outline-none" />
        </div>

        {message && <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr_.8fr_.7fr] bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            <div>Kompaniya</div><div>Plan / Narx</div><div>Limit</div><div>To‘lov</div><div>Status</div><div className="text-right">Amal</div>
          </div>
          {loading ? <div className="p-6 text-sm font-bold text-slate-400">Yuklanmoqda...</div> : filtered.length === 0 ? <div className="p-6 text-sm font-bold text-slate-400">Kompaniya topilmadi</div> : filtered.map((c) => {
            const modules = c.enabledModules || [];
            const clientLimit = getMeta(modules, "LIMIT_CLIENTS_", "—");
            const userLimit = getMeta(modules, "LIMIT_USERS_", "—");
            const price = getMeta(modules, "MONTHLY_PRICE_", "0");
            const nextPay = getMeta(modules, "NEXT_PAYMENT_", "—");
            return <div key={c.id} className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr_.8fr_.7fr] items-center border-t border-slate-100 px-5 py-4 text-sm">
              <div><p className="font-black text-slate-900">{c.name}</p><p className="mt-1 text-xs font-bold text-slate-400">{c.phone || "Telefon yo‘q"} · user: {c._stats?.usersCount ?? c.users?.length ?? 0} · client: {c._stats?.clientsCount ?? 0}</p></div>
              <div><p className="font-black">{c.subscriptionPlan || "STARTER"}</p><p className="text-xs font-bold text-slate-400">{money(price)}</p></div>
              <div className="text-xs font-bold text-slate-500"><p>Client: {clientLimit}</p><p>User: {userLimit}</p></div>
              <div className="text-xs font-bold text-slate-500">{nextPay}</div>
              <div><select value={c.status || "TRIAL"} onChange={(e) => quickStatus(c, e.target.value as Status)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black outline-none"><option>TRIAL</option><option>ACTIVE</option><option>BLOCKED</option></select></div>
              <div className="text-right"><button onClick={() => openEdit(c)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black hover:bg-slate-50"><SlidersHorizontal className="mr-1 inline" size={14}/> Boshqarish</button></div>
            </div>;
          })}
        </div>
      </section>

      {modal && <Modal title={modal === "create" ? "Yangi kompaniya" : "Kompaniyani boshqarish"} onClose={() => setModal(null)}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Kompaniya nomi" value={form.companyName} onChange={(v) => setForm({...form, companyName: v})}/>
          <Input label="Kompaniya telefoni" value={form.companyPhone} onChange={(v) => setForm({...form, companyPhone: v})}/>
          {modal === "create" && <><Input label="Owner ismi" value={form.ownerName} onChange={(v) => setForm({...form, ownerName: v})}/><Input label="Owner telefon" value={form.ownerPhone} onChange={(v) => setForm({...form, ownerPhone: v})}/><Input label="Owner parol" value={form.ownerPassword} onChange={(v) => setForm({...form, ownerPassword: v})}/></>}
          <label className="block"><span className="text-xs font-black uppercase text-slate-400">Status</span><select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as Status})} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-bold outline-none"><option>TRIAL</option><option>ACTIVE</option><option>BLOCKED</option></select></label>
          <label className="block"><span className="text-xs font-black uppercase text-slate-400">Plan</span><select value={form.plan} onChange={(e) => applyPlan(e.target.value as Plan)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-bold outline-none"><option>STARTER</option><option>BUSINESS</option><option>PRO</option><option>CUSTOM</option></select></label>
          <Input label="Oylik narx UZS" value={String(form.monthlyPrice)} onChange={(v) => setForm({...form, monthlyPrice: Number(v.replace(/\D/g, "") || 0), plan: form.plan === "CUSTOM" ? "CUSTOM" : form.plan})}/>
          <Input label="Mijoz limiti" value={form.clientLimit} onChange={(v) => setForm({...form, clientLimit: v, plan: "CUSTOM"})}/>
          <Input label="User limiti" value={form.userLimit} onChange={(v) => setForm({...form, userLimit: v, plan: "CUSTOM"})}/>
          <Input label="Oxirgi to‘lov sanasi" type="date" value={form.lastPaymentDate} onChange={(v) => setForm({...form, lastPaymentDate: v})}/>
          <Input label="Keyingi to‘lov sanasi" type="date" value={form.nextPaymentDate} onChange={(v) => setForm({...form, nextPaymentDate: v})}/>
        </div>
        <div className="mt-5"><p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Modullar</p><div className="grid grid-cols-2 gap-3">{MODULES.map((m) => <button key={m.code} onClick={() => toggleModule(m.code)} className={`rounded-2xl border p-4 text-left transition ${form.modules.includes(m.code) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><p className="font-black">{m.label}</p><p className="mt-1 text-xs font-semibold text-slate-500">{m.desc}</p></button>)}</div></div>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setModal(null)} className="rounded-2xl border border-slate-200 px-5 py-3 font-black">Bekor qilish</button><button onClick={save} className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">Saqlash</button></div>
      </Modal>}
    </main>
  );
}

function Stat({ title, value, icon }: { title: string; value: any; icon: any }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div><p className="text-sm font-black text-slate-400">{title}</p><p className="mt-3 text-4xl font-black tracking-[-0.06em]">{value}</p></div>;
}
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <label className="block"><span className="text-xs font-black uppercase text-slate-400">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-bold outline-none focus:border-blue-400" /></label>;
}
function Modal({ title, children, onClose }: { title: string; children: any; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] bg-white p-7 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-3xl font-black tracking-[-0.05em]">{title}</h2><button onClick={onClose} className="rounded-2xl border border-slate-200 p-3 hover:bg-slate-50"><X size={18}/></button></div>{children}</div></div>;
}
