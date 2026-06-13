"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Warehouse = { id: string; name: string; address?: string | null; isActive?: boolean };

export default function WarehousesPage() {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiJson<Warehouse[]>("/inventory/warehouses");
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Omborlar yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      if (editing) {
        await apiJson(`/inventory/warehouses/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, address }),
        });
      } else {
        await apiJson("/inventory/warehouses", {
          method: "POST",
          body: JSON.stringify({ name, address }),
        });
      }
      setName("");
      setAddress("");
      setEditing(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Saqlanmadi");
    }
  }

  function startEdit(item: Warehouse) {
    setEditing(item);
    setName(item.name);
    setAddress(item.address || "");
  }

  return (
    <AppLayout title="Omborlar" subtitle="Filial va skladlar boshqaruvi.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="premium-card mb-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">{editing ? "Omborni tahrirlash" : "Yangi ombor"}</h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <Field label="Nomi" value={name} onChange={setName} />
          <Field label="Manzil" value={address} onChange={setAddress} />
          <div className="flex items-end gap-3">
            <button onClick={save} className="premium-button premium-button-primary">Saqlash</button>
            {editing ? <button onClick={() => { setEditing(null); setName(""); setAddress(""); }} className="premium-button premium-button-soft">Bekor</button> : null}
          </div>
        </div>
      </div>

      <div className="premium-card p-6">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
            <tr>
              <th className="p-4 font-normal">Nomi</th>
              <th className="p-4 font-normal">Manzil</th>
              <th className="p-4 text-right font-normal">Amal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[#edf2f7]">
                <td className="p-4">{item.name}</td>
                <td className="p-4 text-[#64748b]">{item.address || "—"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(item)} className="rounded-[14px] bg-[#f5f7fa] px-4 py-2 text-[13px] text-[#64748b]">Edit</button>
                </td>
              </tr>
            ))}
            {!items.length ? <tr><td colSpan={3} className="p-8 text-center text-[#8aa0ba]">Ombor yo‘q</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="premium-label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="premium-input" />
    </label>
  );
}
