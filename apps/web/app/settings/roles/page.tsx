'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/operixApi';

const roles = ['OWNER', 'MANAGER', 'CASHIER', 'STOREKEEPER', 'ACCOUNTANT', 'HR'];

export default function RolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [u, m] = await Promise.all([api('/permissions/users'), api('/permissions/modules')]);
      setUsers(Array.isArray(u) ? u : []);
      setModules(Array.isArray(m) ? m : []);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: string) {
    await api(`/permissions/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    await load();
  }

  async function setPerm(userId: string, module: string, checked: boolean) {
    await api(`/permissions/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ module, canView: checked, canCreate: checked, canUpdate: checked, canDelete: false }),
    });
    await load();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Rollar va ruxsatlar</h1>
        <p className="text-slate-500">Kassir, skladchi, accountant va HR uchun modul dostup.</p>
      </div>
      {error && <div className="rounded-2xl bg-red-50 p-4 text-red-600">{error}</div>}
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-950">{user.fullName}</h3>
                <p className="text-sm text-slate-500">{user.phone}</p>
              </div>
              <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {modules.map((m) => {
                const custom = user.permissions?.find((p: any) => p.module === m);
                const checked = Boolean(custom?.canView);
                return (
                  <label key={m} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={(e) => setPerm(user.id, m, e.target.checked)} />
                    {m}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
