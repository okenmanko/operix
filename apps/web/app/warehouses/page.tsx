"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Warehouse = {
  id: string;
  name: string;
  address?: string | null;
  productCount?: number;
  totalQuantity?: number;
  totalValue?: number;
  totalCostValueUSD?: number;
  totalSaleValueUSD?: number;
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Warehouse[]>("/inventory/warehouses");
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Omborlar yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    await apiJson("/inventory/warehouses", { method: "POST", body: JSON.stringify({ name, address }) });
    setName("");
    setAddress("");
    await load();
  }

  const totalQuantity = warehouses.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);
  const totalCost = warehouses.reduce((sum, item) => sum + Number(item.totalCostValueUSD || 0), 0);
  const totalSale = warehouses.reduce((sum, item) => sum + Number(item.totalSaleValueUSD || item.totalValue || 0), 0);

  return (
    <AppLayout title="Omborlar" subtitle="Skladlar ichidagi mahsulotlar, tannarx va sotuv qiymati.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Omborlar" value={`${num(warehouses.length)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(totalQuantity)} dona`} />
        <Stat label="Tannarx summa" value={money(totalCost, "USD")} />
        <Stat label="Sotuv summa" value={money(totalSale, "USD")} />
      </div>

      <div className="premium-card mb-5 p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">Yangi ombor</h2>
        <div className="mt-5 grid grid-cols-[1fr_1fr_140px] gap-4 max-md:grid-cols-1">
          <input value={name} onChange={(e) => setName(e.target.value)} className="premium-input" placeholder="Nomi" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="premium-input" placeholder="Manzil" />
          <button onClick={create} className="premium-button premium-button-primary">Saqlash</button>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em]">Omborlar</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Ombor ustiga bosing — ichidagi mahsulotlar ochiladi.</p>
          </div>
          <a href="/integrations" className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white shadow-[0_12px_26px_rgba(49,94,251,0.22)]">MoySklad sync</a>
        </div>

        <div className="overflow-x-auto rounded-[22px] border border-[#edf2f7]">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Nomi</th>
                <th className="p-4 font-normal">Manzil</th>
                <th className="p-4 font-normal">Mahsulot turi</th>
                <th className="p-4 font-normal">Jami dona</th>
                <th className="p-4 font-normal">Tannarx summa</th>
                <th className="p-4 font-normal">Sotuv summa</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="border-t border-[#edf2f7] transition hover:bg-[#f8fafc]">
                  <td className="p-4 text-[#111827]"><Link href={`/warehouses/${encodeURIComponent(warehouse.id)}`} className="hover:text-[#315efb]">{warehouse.name}</Link></td>
                  <td className="p-4 text-[#64748b]">{warehouse.address || "—"}</td>
                  <td className="p-4 text-[#111827]">{num(warehouse.productCount || 0)} ta</td>
                  <td className="p-4 text-[#111827]">{num(warehouse.totalQuantity || 0)} dona</td>
                  <td className="p-4 text-[#111827]">{money(warehouse.totalCostValueUSD || 0, "USD")}</td>
                  <td className="p-4 text-[#111827]">{money(warehouse.totalSaleValueUSD || warehouse.totalValue || 0, "USD")}</td>
                </tr>
              ))}
              {!warehouses.length ? <tr><td colSpan={6} className="p-10 text-center text-[#8aa0ba]">Ombor yo‘q. Integratsiyalar sahifasidan MoySklad sync qiling.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[#64748b]">{label}</p><p className="mt-4 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}
