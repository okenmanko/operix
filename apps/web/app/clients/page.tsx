"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UserPlus, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ActionBar from "../components/ui/ActionBar";
import ClientsExcelTools from "../components/ClientsExcelTools";
import { apiJson, dateText, num } from "../lib/api";
import { can } from "../lib/permissions";

type Client = {
  id: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  guarantorName?: string | null;
  guarantorPhone?: string | null;
  createdAt?: string;
};

const blank = {
  fullName: "",
  phone: "",
  address: "",
  guarantorName: "",
  guarantorPhone: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Client[]>("/clients");
      setClients(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mijozlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter((client) =>
      (client.fullName || "").toLowerCase().includes(q) ||
      (client.phone || "").includes(query) ||
      (client.address || "").toLowerCase().includes(q),
    );
  }, [clients, query]);

  async function createClient() {
    try {
      setError("");
      await apiJson("/clients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModal(false);
      setForm(blank);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mijoz qo‘shilmadi");
    }
  }

  return (
    <AppLayout title="Mijozlar" subtitle="Mijozlar bazasi, QARZ Excel import/export va tezkor qidiruv.">
      {error ? (
        <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <ActionBar
        title="Tezkor amallar"
        subtitle="Mijoz qo‘shish va QARZ Excel import/export."
        items={[
          {
            label: "Mijoz qo‘shish",
            icon: <UserPlus size={17} />,
            action: "clients:create",
            onClick: () => setModal(true),
          },
        ]}
      />

      <ClientsExcelTools onDone={load} />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat label="Jami mijozlar" value={`${num(clients.length)} ta`} />
        <Stat label="Qidiruv natijasi" value={`${num(filtered.length)} ta`} />
        <Stat label="Status" value="Active" />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[#111827]">Mijozlar</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qidiruv va mijozlar ro‘yxati.</p>
          </div>

          <div className="flex h-12 w-[360px] items-center gap-3 rounded-[18px] border border-[#dfe8f3] bg-white px-4">
            <Search size={18} className="text-[#8aa0ba]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a6b4c7]"
            />
            {query ? (
              <button onClick={() => setQuery("")}>
                <X size={16} className="text-[#8aa0ba]" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th>
                <th className="p-4 font-normal">Telefon</th>
                <th className="p-4 font-normal">Manzil</th>
                <th className="p-4 font-normal">Kafil</th>
                <th className="p-4 text-right font-normal">Sana</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-t border-[#edf2f7]">
                  <td className="p-4 text-[#111827]">{client.fullName}</td>
                  <td className="p-4 text-[#64748b]">{client.phone || "—"}</td>
                  <td className="p-4 text-[#64748b]">{client.address || "—"}</td>
                  <td className="p-4 text-[#64748b]">
                    {client.guarantorName || "—"} {client.guarantorPhone ? `• ${client.guarantorPhone}` : ""}
                  </td>
                  <td className="p-4 text-right text-[#64748b]">{dateText(client.createdAt)}</td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#8aa0ba]">
                    Ma’lumot yo‘q
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal && can("clients:create") ? (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/35 backdrop-blur-[4px]">
          <div className="absolute left-1/2 top-1/2 w-[720px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[32px] border border-[#e7edf5] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-7 py-5">
              <div>
                <h2 className="text-[28px] font-normal tracking-[-0.05em]">Mijoz qo‘shish</h2>
                <p className="mt-1 text-[13px] text-[#8aa0ba]">Mijoz va kafil ma’lumotlari.</p>
              </div>
              <button onClick={() => setModal(false)} className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f5f7fa] text-[#64748b]">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-7 py-6">
              <Input label="Ism familiya" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
              <Input label="Telefon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Input label="Manzil" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
              <Input label="Kafil ismi" value={form.guarantorName} onChange={(value) => setForm({ ...form, guarantorName: value })} />
              <Input label="Kafil telefoni" value={form.guarantorPhone} onChange={(value) => setForm({ ...form, guarantorPhone: value })} />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#edf2f7] px-7 py-5">
              <button onClick={() => setModal(false)} className="premium-button premium-button-soft">Bekor</button>
              <button onClick={createClient} className="premium-button premium-button-primary">Saqlash</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[13px] font-normal text-[#64748b]">{label}</p>
      <p className="mt-5 text-[30px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="premium-label">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input" />
    </label>
  );
}
