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

type EditingUser = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  companyId: string;
  password: string;
};

export default function UsersPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  function showSuccess(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 2500);
  }

  async function createUser() {
    try {
      setError("");
      setSuccess("");

      await apiJson("/super-admin/users", {
        method: "POST",
        body: JSON.stringify({ companyId, fullName, phone, password, role }),
      });

      setFullName("");
      setPhone("");
      setPassword("");
      setRole("MANAGER");
      await load();
      showSuccess("User yaratildi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "User yaratilmadi");
    }
  }

  function openEdit(user: User) {
    setEditingUser({
      id: user.id,
      fullName: user.fullName || "",
      phone: user.phone || "",
      role: user.role || "MANAGER",
      companyId: user.companyId || "",
      password: "",
    });
  }

  async function saveEdit() {
    if (!editingUser) return;

    try {
      setError("");
      setSuccess("");

      await apiJson(`/super-admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: editingUser.fullName,
          phone: editingUser.phone,
          role: editingUser.role,
          companyId: editingUser.companyId,
          ...(editingUser.password.trim() ? { password: editingUser.password.trim() } : {}),
        }),
      });

      setEditingUser(null);
      await load();
      showSuccess("User tahrirlandi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "User tahrirlanmadi");
    }
  }

  async function updateRole(userId: string, nextRole: string) {
    try {
      setError("");
      setSuccess("");

      await apiJson(`/super-admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });

      await load();
      showSuccess("Role o‘zgardi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role o‘zgarmadi");
    }
  }

  async function toggleBlock(user: User) {
    try {
      setError("");
      setSuccess("");

      await apiJson(`/super-admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      await load();
      showSuccess(user.isActive ? "User bloklandi" : "User aktiv qilindi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status o‘zgarmadi");
    }
  }

  async function confirmDelete() {
    if (!deleteUserId) return;

    try {
      setError("");
      setSuccess("");

      await apiJson(`/super-admin/users/${deleteUserId}`, {
        method: "DELETE",
      });

      setDeleteUserId("");
      await load();
      showSuccess("User o‘chirildi");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "User o‘chirilmadi");
    }
  }

  const deletingUser = users.find((user) => user.id === deleteUserId);

  return (
    <SuperAdminShell>
      <PageTop title="User Management" subtitle="Kompaniya userlari, rollar va aktivlik." />

      {error ? <Toast>{error}</Toast> : null}

      {success ? (
        <div className="mb-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">
          {success}
        </div>
      ) : null}

      <Card className="mb-5 p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">User yaratish</h2>

        <div className="mt-5 grid grid-cols-5 gap-4">
          <Select label="Kompaniya" value={companyId} onChange={setCompanyId} options={companyOptions} />
          <Input label="Ism" value={fullName} onChange={setFullName} />
          <Input label="Telefon" value={phone} onChange={setPhone} />
          <Input label="Parol" value={password} onChange={setPassword} type="password" />
          <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        </div>

        <Button className="mt-5" onClick={createUser}>
          User yaratish
        </Button>
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

                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="soft" className="h-10 px-4" onClick={() => openEdit(user)}>
                        Edit
                      </Button>

                      <Button variant={user.isActive ? "danger" : "soft"} className="h-10 px-4" onClick={() => toggleBlock(user)}>
                        {user.isActive ? "Block" : "Unblock"}
                      </Button>

                      <Button variant="danger" className="h-10 px-4" onClick={() => setDeleteUserId(user.id)}>
                        Delete
                      </Button>
                    </div>
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

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[760px] rounded-[30px] border border-[#e7edf5] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-5 flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[26px] font-normal tracking-[-0.045em] text-[#101828]">User tahrirlash</h2>
                <p className="mt-2 text-[14px] text-[#6d7b90]">
                  Ism, telefon, parol, role va kompaniyani o‘zgartirish.
                </p>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="h-10 rounded-[16px] bg-[#f5f7fa] px-4 text-[13px] text-[#52637a] transition hover:bg-[#eef3f8]"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ism"
                value={editingUser.fullName}
                onChange={(value) => setEditingUser({ ...editingUser, fullName: value })}
              />

              <Input
                label="Telefon"
                value={editingUser.phone}
                onChange={(value) => setEditingUser({ ...editingUser, phone: value })}
              />

              <Input
                label="Yangi parol"
                value={editingUser.password}
                onChange={(value) => setEditingUser({ ...editingUser, password: value })}
                type="password"
                placeholder="Bo‘sh qoldirilsa parol o‘zgarmaydi"
              />

              <Select
                label="Role"
                value={editingUser.role}
                onChange={(value) => setEditingUser({ ...editingUser, role: value })}
                options={ROLES}
              />

              <div className="col-span-2">
                <Select
                  label="Kompaniya"
                  value={editingUser.companyId}
                  onChange={(value) => setEditingUser({ ...editingUser, companyId: value })}
                  options={companyOptions}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="soft" onClick={() => setEditingUser(null)}>
                Bekor qilish
              </Button>

              <Button onClick={saveEdit}>Saqlash</Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[30px] border border-[#e7edf5] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <h2 className="text-[26px] font-normal tracking-[-0.045em] text-[#101828]">Userni o‘chirish</h2>

            <p className="mt-3 text-[15px] leading-6 text-[#6d7b90]">
              Rostdan ham <span className="text-[#101828]">{deletingUser?.fullName || "bu user"}</span> ni o‘chirasizmi?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="soft" onClick={() => setDeleteUserId("")}>
                Bekor qilish
              </Button>

              <Button variant="danger" onClick={confirmDelete}>
                Ha, o‘chirish
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
}
