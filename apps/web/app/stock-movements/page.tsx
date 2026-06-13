"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Product = { id: string; name: string };
type Warehouse = { id: string; name: string };
type Movement = {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
  product?: { name: string };
  warehouse?: { name: string };
  comment?: string | null;
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productId, setProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [m, p, w] = await Promise.all([
        apiJson<Movement[]>("/inventory/movements"),
        apiJson<Product[]>("/inventory/products"),
        apiJson<Warehouse[]>("/inventory/warehouses"),
      ]);
      setMovements(Array.isArray(m) ? m : []);
      setProducts(Array.isArray(p) ? p : []);
      setWarehouses(Array.isArray(w) ? w : []);
      if (!productId && p?.[0]?.id) setProductId(p[0].id);
      if (!fromWarehouseId && w?.[0]?.id) setFromWarehouseId(w[0].id);
      if (!toWarehouseId && w?.[1]?.id) setToWarehouseId(w[1].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Movement yuklanmadi");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function transfer() {
    try {
      await apiJson("/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: Number(quantity || 1),
        }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transfer bajarilmadi");
    }
  }

  return (
    <AppLayout title="Stock Movement" subtitle="Omborlar orasida transfer va movement history.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="premium-card mb-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Transfer</h2>
        <div className="mt-5 grid grid-cols-5 gap-4">
          <Select label="Mahsulot" value={productId} onChange={setProductId} options={products.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Qayerdan" value={fromWarehouseId} onChange={setFromWarehouseId} options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          <Select label="Qayerga" value={toWarehouseId} onChange={setToWarehouseId} options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          <Field label="Miqdor" value={quantity} onChange={setQuantity} />
          <div className="flex items-end"><button onClick={transfer} className="premium-button premium-button-primary w-full">Transfer</button></div>
        </div>
      </div>

      <div className="premium-card p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">History</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Sana</th>
                <th className="p-4 font-normal">Type</th>
                <th className="p-4 font-normal">Mahsulot</th>
                <th className="p-4 font-normal">Ombor</th>
                <th className="p-4 font-normal">Miqdor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((item) => (
                <tr key={item.id} className="border-t border-[#edf2f7]">
                  <td className="p-4 text-[#64748b]">{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
                  <td className="p-4">{item.type}</td>
                  <td className="p-4">{item.product?.name || "—"}</td>
                  <td className="p-4 text-[#64748b]">{item.warehouse?.name || "—"}</td>
                  <td className="p-4">{item.quantity}</td>
                </tr>
              ))}
              {!movements.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Movement yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="premium-label">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="premium-input" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label>
      <span className="premium-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="premium-input">
        <option value="">Tanlang</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
