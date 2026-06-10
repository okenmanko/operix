"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Product = { id: string; name: string };
type Warehouse = { id: string; name: string };
type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason?: string | null;
  comment?: string | null;
  createdAt: string;
  product?: { name: string } | null;
  warehouse?: { name: string } | null;
  stockItem?: { qrCode: string } | null;
};

const badge: Record<string, string> = {
  IN: "bg-emerald-50 text-emerald-600",
  OUT: "bg-red-50 text-red-600",
  TRANSFER: "bg-sky-50 text-sky-600",
  RESERVE: "bg-amber-50 text-amber-600",
  RETURN: "bg-violet-50 text-violet-600",
  WRITE_OFF: "bg-slate-100 text-slate-600",
};

export default function StockMovementsPage() {
  const [items, setItems] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productId, setProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");

  async function load() {
    const [m, p, w] = await Promise.all([
      apiJson<Movement[]>("/inventory/movements"),
      apiJson<Product[]>("/inventory/products"),
      apiJson<Warehouse[]>("/inventory/warehouses"),
    ]);
    setItems(Array.isArray(m) ? m : []);
    setProducts(Array.isArray(p) ? p : []);
    setWarehouses(Array.isArray(w) ? w : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function transfer() {
    if (!productId || !fromWarehouseId || !toWarehouseId) return;

    await apiJson("/inventory/transfer", {
      method: "POST",
      body: JSON.stringify({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: Number(quantity || 1),
      }),
    });

    setQuantity("1");
    await load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) =>
      [m.type, m.product?.name, m.warehouse?.name, m.stockItem?.qrCode, m.reason, m.comment]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  return (
    <AppLayout title="Harakatlar" subtitle="Kirim, chiqim, transfer, rezerv va QR tarix">
      <div className="grid grid-cols-[430px_1fr] gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Skladlar orasida transfer</h2>

          <div className="mt-5 space-y-3">
            <select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Mahsulot tanlang</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}>
              <option value="">Qaysi skladdan</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>

            <select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)}>
              <option value="">Qaysi skladga</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>

            <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Miqdor" />

            <button onClick={transfer} className="h-12 w-full rounded-2xl bg-slate-950 text-[14px] font-bold text-white transition hover:bg-slate-800">
              Transfer qilish
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Harakatlar jurnali</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="h-10 w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[110px_1fr_150px_170px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
              <div>Type</div>
              <div>Mahsulot / QR</div>
              <div>Sklad</div>
              <div className="text-right">Vaqt</div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>
            ) : (
              filtered.map((m) => (
                <div key={m.id} className="grid grid-cols-[110px_1fr_150px_170px] items-center border-t border-slate-100 px-4 py-4">
                  <div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${badge[m.type] || "bg-slate-100 text-slate-500"}`}>{m.type}</span></div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-950">{m.product?.name || "-"}</p>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-slate-400">{m.stockItem?.qrCode || m.reason || "-"}</p>
                  </div>
                  <div className="text-[13px] font-semibold text-slate-500">{m.warehouse?.name || "-"}</div>
                  <div className="text-right text-[12px] font-semibold text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
