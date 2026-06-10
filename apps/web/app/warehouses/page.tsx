"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Warehouse = {
  id: string;
  name: string;
  address?: string | null;
  isActive: boolean;
  totalQty?: number;
  inStockQty?: number;
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  async function load() {
    const data = await apiJson<Warehouse[]>("/inventory/warehouses");
    setWarehouses(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function reset() {
    setEditing(null);
    setName("");
    setAddress("");
  }

  function startEdit(item: Warehouse) {
    setEditing(item);
    setName(item.name);
    setAddress(item.address || "");
  }

  async function save() {
    if (!name.trim()) return;

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

    reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Skladni o‘chiramizmi? Ichida qoldiq bo‘lsa inactive bo‘ladi.")) return;
    await apiJson(`/inventory/warehouses/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AppLayout title="Skladlar" subtitle="Filial, ombor va saqlash joylari">
      <div className="grid grid-cols-[420px_1fr] gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
              {editing ? "Skladni tahrirlash" : "Yangi sklad"}
            </h2>

            {editing && (
              <button onClick={reset} className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-bold text-slate-500">
                Bekor
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sklad nomi" />
            <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Manzil" />

            <button onClick={save} className="h-12 w-full rounded-2xl bg-sky-500 text-[14px] font-bold text-white transition hover:bg-sky-600">
              Saqlash
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Skladlar</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1fr_100px_100px_140px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
              <div>Nomi</div>
              <div className="text-right">Qoldiq</div>
              <div className="text-right">Status</div>
              <div className="text-right">Action</div>
            </div>

            {warehouses.length === 0 ? (
              <div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>
            ) : (
              warehouses.map((w) => (
                <div key={w.id} className="grid grid-cols-[1fr_100px_100px_140px] items-center border-t border-slate-100 px-4 py-4">
                  <div>
                    <p className={`text-[14px] font-bold ${w.isActive ? "text-slate-950" : "text-slate-400"}`}>{w.name}</p>
                    <p className="mt-1 text-[12px] font-medium text-slate-400">{w.address || "-"}</p>
                  </div>

                  <div className="text-right text-[14px] font-bold text-slate-950">{w.inStockQty || 0}</div>

                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${w.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {w.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(w)} className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-bold text-slate-600">
                      Edit
                    </button>
                    <button onClick={() => remove(w.id)} className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">
                      Del
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
