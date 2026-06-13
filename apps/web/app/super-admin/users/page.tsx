"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../lib/api";
import {
  Button,
  Card,
  Company,
  Input,
  PageTop,
  ROLES,
  Select,
  StatusBadge,
  SuperAdminShell,
  Toast,
  User,
} from "../_components";

export default function UsersPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [companiesData, usersData] = await Promise.all([
        apiJson<Company[]>("/super-admin/companies"),
        apiJson<User[]>("/super-admin/users"),
      ]);

      const safeCompanies = Array.isArray(companiesData) ? companiesData : [];
      setCompanies(safeCompanies);
      setUsers(Array.isArray(usersData) ? usersData : []);

      if (!companyId && safeCompanies[0]?.id) setCompanyId(safeCompanies[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Userlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: company.id, label: company.name })),
    [companies],
  );

  async function createUser() {
    try {
      setError("");
      await apiJson("/super-admin/users", {
        method: "POST",
        body: JSON.stringify({ companyId, fullName, phone, password, role }),
      });

      setFullName("");
      setPhone("");
      setPassword("");
      setRole("MANAGER");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "User yaratilmadi");
    }
  }

  async function updateRole(userId: string, nextRole: string) {
    try {
      setError("");
      await apiJson(`/super-admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role o‘zgarmadi");
    }
  }

  async function toggleBlock(user: User) {
    try {
      setError("");
      await apiJson(`/super-admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status o‘zgarmadi");
    }
  }

  return (
    <SuperAdminShell>
      <PageTop title="User Management" subtitle="Kompaniya userlari, rollar va aktivlik." />
      {error ? <Toast>{error}</Toast> : null}

      <Card className="mb-5 p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">User yaratish</h2>
        <div className="mt-5 grid grid-cols-5 gap-4">
          <Select label="Kompaniya" value={companyId} onChange={setCompanyId} options={companyOptions} />
          <Input label="Ism" value={fullName} onChange={setFullName} />
          <Input label="Telefon" value={phone} onChange={setPhone} />
          <Input label="Parol" value={password} onChange={setPassword} />
          <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        </div>
        <Button className="mt-5" onClick={createUser}>User yaratish</Button>
      </Card>

      <Card className="p-6">
        <div className="overflow-visible rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Ism</th>
                <th className="p-4 font-normal">Telefon</th>
                <th className="p-4 font-normal">Kompaniya</th>
                <th className="p-4 font-normal">Role</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 text-right font-normal">Amal</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">{user.fullName}</td>
                  <td className="p-4 text-[#64748b]">{user.phone}</td>
                  <td className="p-4 text-[#64748b]">
                    {user.company?.name || companies.find((company) => company.id === user.companyId)?.name || "—"}
                  </td>
                  <td className="p-4">
                    <div className="w-[170px]">
                      <Select label="" value={user.role} onChange={(value) => updateRole(user.id, value)} options={ROLES} />
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={user.isActive ? "ACTIVE" : "BLOCKED"} />
                  </td>
                  <td className="p-4 text-right">
                    <Button variant={user.isActive ? "danger" : "soft"} onClick={() => toggleBlock(user)}>
                      {user.isActive ? "Block" : "Unblock"}
                    </Button>
                  </td>
                </tr>
              ))}

              {!users.length ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8aa0ba]">
                    User yo‘q
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </SuperAdminShell>
  );
}
