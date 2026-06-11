"use client";

import { useEffect, useState } from "react";
import SuperAdminLayout from "../../components/SuperAdminLayout";
import { apiJson } from "../../lib/api";

type User = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  company?: { id: string; name: string };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyId: "",
    fullName: "",
    phone: "",
    password: "",
    role: "MANAGER",
  });

  async function load() {
    try {
      const [u, c] = await Promise.all([
        apiJson<User[]>("/super-admin/users"),
        apiJson<any[]>("/super-admin/companies"),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setCompanies(Array.isArray(c) ? c : []);
      if (!form.companyId && c?.[0]?.id) {
        setForm((old) => ({ ...old, companyId: c[0].id }));
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    await apiJson("/super-admin/users", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ ...form, fullName: "", phone: "", password: "" });
    await load();
  }

  async function updateUser(id: string, body: any) {
    await apiJson(`/super-admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    await load();
  }

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black">User Management</h1>
        <p className="mt-3 text-base font-semibold text-slate-500">
          Kompaniya userlari va rollar
        </p>
      </div>

      {error && <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>}

      <form onSubmit={createUser} className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-2xl font-black">User yaratish</h2>
        <div className="grid grid-cols-5 gap-4">
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-slate-400">Kompaniya</span>
            <select className="h-12 w-full rounded-2xl border px-4" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Input label="Ism" value={form.fullName} onChange={(v: string) => setForm({ ...form, fullName: v })} />
          <Input label="Telefon" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} />
          <Input label="Parol" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} />
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-slate-400">Role</span>
            <select className="h-12 w-full rounded-2xl border px-4" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {["OWNER", "ADMIN", "MANAGER", "CASHIER", "STOREKEEPER", "HR", "ACCOUNTANT"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <button className="mt-6 h-12 rounded-2xl bg-slate-950 px-8 text-sm font-black text-white">Saqlash</button>
      </form>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Ism</th>
              <th className="p-4">Telefon</th>
              <th className="p-4">Kompaniya</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Amal</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-4 font-black">{u.fullName}</td>
                <td className="p-4">{u.phone}</td>
                <td className="p-4">{u.company?.name}</td>
                <td className="p-4">
                  <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })} className="rounded-xl border px-3 py-2">
                    {["OWNER", "ADMIN", "MANAGER", "CASHIER", "STOREKEEPER", "HR", "ACCOUNTANT"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="p-4">{u.isActive ? "ACTIVE" : "BLOCKED"}</td>
                <td className="p-4">
                  <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} className="rounded-xl bg-slate-100 px-4 py-2 font-black">
                    {u.isActive ? "Block" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SuperAdminLayout>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase text-slate-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-2xl border px-4" />
    </label>
  );
}
