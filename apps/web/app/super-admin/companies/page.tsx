"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { apiJson, money, num } from "../../lib/api";
import {
  Button,
  Card,
  Company,
  Input,
  MODULES,
  PageTop,
  PLANS,
  Select,
  STATUSES,
  StatusBadge,
  SuperAdminShell,
  Toast,
} from "../_components";

const blank = {
  id: "",
  name: "",
  phone: "",
  status: "TRIAL",
  subscriptionPlan: "STARTER",
  clientLimit: "100",
  userLimit: "3",
  productLimit: "100",
  warehouseLimit: "1",
  monthlyPriceUZS: "0",
  enabledModules: ["CRM", "DEBTS", "PAYMENTS", "REPORTS"],
};

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<any>(blank);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Company[]>("/super-admin/companies");
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kompaniyalar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          (item.phone || "").includes(query),
      ),
    [items, query],
  );

  function edit(company?: Company) {
    if (!company) {
      setForm(blank);
    } else {
      setForm({
        id: company.id,
        name: company.name || "",
        phone: company.phone || "",
        status: company.status || "TRIAL",
        subscriptionPlan: company.subscriptionPlan || "STARTER",
        clientLimit: String(company.clientLimit ?? 100),
        userLimit: String(company.userLimit ?? 3),
        productLimit: String(company.productLimit ?? 100),
        warehouseLimit: String(company.warehouseLimit ?? 1),
        monthlyPriceUZS: String(company.monthlyPriceUZS ?? 0),
        enabledModules: company.enabledModules?.length ? company.enabledModules : [],
      });
    }

    setModal(true);
  }

  async function save() {
    try {
      setError("");
      const body = {
        name: form.name,
        phone: form.phone || null,
        status: form.status,
        subscriptionPlan: form.subscriptionPlan,
        clientLimit: Number(form.clientLimit || 0),
        userLimit: Number(form.userLimit || 0),
        productLimit: Number(form.productLimit || 0),
        warehouseLimit: Number(form.warehouseLimit || 0),
        monthlyPriceUZS: Number(form.monthlyPriceUZS || 0),
        enabledModules: form.enabledModules || [],
      };

      if (form.id) {
        await apiJson(`/super-admin/companies/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiJson("/super-admin/companies", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setModal(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Saqlanmadi");
    }
  }

  function toggleModule(key: string) {
    setForm((current: any) => {
      const has = current.enabledModules.includes(key);
      return {
        ...current,
        enabledModules: has
          ? current.enabledModules.filter((item: string) => item !== key)
          : [...current.enabledModules, key],
      };
    });
  }

  return (
    <SuperAdminShell>
      <PageTop
        title="Kompaniyalar"
        subtitle="Tarif, status, modul va limitlarni bitta joydan boshqaring."
        action={
          <Button onClick={() => edit()}>
            <span className="inline-flex items-center gap-2">
              <Plus size={18} /> Yangi kompaniya
            </span>
          </Button>
        }
      />
      {error ? <Toast>{error}</Toast> : null}

      <Card className="mb-5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f5f8ff] text-[#315efb]">
            <Search size={19} />
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kompaniya yoki telefon bo‘yicha qidirish"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#9aa9bd]"
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Nomi</th>
                <th className="p-4 font-normal">Plan</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Limitlar</th>
                <th className="p-4 font-normal">Narx</th>
                <th className="p-4 text-right font-normal">Amal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">
                    <p>{company.name}</p>
                    <p className="mt-1 text-[12px] text-[#8aa0ba]">{company.phone || "—"}</p>
                  </td>
                  <td className="p-4 text-[#64748b]">{company.subscriptionPlan}</td>
                  <td className="p-4"><StatusBadge status={company.status} /></td>
                  <td className="p-4 text-[#64748b]">
                    C:{num(company.clientLimit)} U:{num(company.userLimit)} P:{num(company.productLimit)} W:{num(company.warehouseLimit)}
                  </td>
                  <td className="p-4">{money(company.monthlyPriceUZS, "UZS")}</td>
                  <td className="p-4 text-right">
                    <Button variant="soft" onClick={() => edit(company)}>Edit</Button>
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8aa0ba]">
                    Kompaniya topilmadi
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {modal ? (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/35 backdrop-blur-[4px]">
          <div className="absolute left-1/2 top-1/2 flex max-h-[88vh] w-[980px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[32px] border border-[#e7edf5] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-7 py-5">
              <div>
                <h2 className="text-[28px] font-normal tracking-[-0.05em]">
                  {form.id ? "Kompaniya edit" : "Yangi kompaniya"}
                </h2>
                <p className="mt-1 text-[13px] text-[#8aa0ba]">
                  Status, tarif, limit va modullar.
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f5f7fa] text-[#64748b]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-7 py-6">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Nomi" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <Input label="Telefon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
                <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={STATUSES} />
                <Select label="Plan" value={form.subscriptionPlan} onChange={(value) => setForm({ ...form, subscriptionPlan: value })} options={PLANS} />
                <Input label="Client limit" value={form.clientLimit} onChange={(value) => setForm({ ...form, clientLimit: value })} />
                <Input label="User limit" value={form.userLimit} onChange={(value) => setForm({ ...form, userLimit: value })} />
                <Input label="Product limit" value={form.productLimit} onChange={(value) => setForm({ ...form, productLimit: value })} />
                <Input label="Warehouse limit" value={form.warehouseLimit} onChange={(value) => setForm({ ...form, warehouseLimit: value })} />
                <Input label="Monthly price UZS" value={form.monthlyPriceUZS} onChange={(value) => setForm({ ...form, monthlyPriceUZS: value })} />
              </div>

              <div className="mt-6 rounded-[28px] border border-[#edf2f7] bg-[#fbfdff] p-5">
                <p className="mb-4 text-[12px] uppercase tracking-[0.16em] text-[#8aa0ba]">
                  Modullar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {MODULES.map((module) => {
                    const active = form.enabledModules.includes(module);
                    return (
                      <button
                        key={module}
                        onClick={() => toggleModule(module)}
                        className={`h-13 rounded-[18px] border px-4 text-[14px] transition ${
                          active
                            ? "border-[#b9d1ff] bg-[#eef4ff] text-[#315efb]"
                            : "border-[#e7edf5] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                        }`}
                      >
                        {module}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#edf2f7] bg-white px-7 py-5">
              <Button variant="soft" onClick={() => setModal(false)}>Bekor</Button>
              <Button onClick={save}>Saqlash</Button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
}
