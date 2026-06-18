"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Summary = {
  products: number;
  warehouses: number;
  totalQuantity: number;
  totalValue?: number;
  totalValueUZS?: number;
  totalValueUSD?: number;
  topWarehouses: Array<{ id: string; name: string; productCount: number; totalQuantity: number; totalValue: number; totalValueUZS?: number; totalValueUSD?: number }>;
};

export default function InventoryPage() {
  const [summary, setSummary] = useState<Summary>({ products: 0, warehouses: 0, totalQuantity: 0, totalValueUZS: 0, totalValueUSD: 0, topWarehouses: [] });
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Summary>("/inventory/summary");
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Inventory yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppLayout title="Inventory" subtitle="MoySklad’dan tovar nomi, aniq narxi, soni va qaysi skladda ekani.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Stat label="Mahsulot turlari" value={`${num(summary.products)} ta`} />
        <Stat label="Omborlar" value={`${num(summary.warehouses)} ta`} />
        <Stat label="Jami dona" value={`${num(summary.totalQuantity)} dona`} />
        <Stat label="UZS qiymat" value={money(summary.totalValueUZS || 0, "UZS")} />
        <Stat label="USD qiymat" value={money(summary.totalValueUSD || 0, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em]">Omborlar bo‘yicha qoldiq</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Har bir skladda nechta mahsulot va qancha summa borligi.</p>
          </div>
          <Link href="/integrations" className="premium-button premium-button-primary">MoySklad sync</Link>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-[#edf2f7]">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr><th className="p-4 font-normal">Ombor</th><th className="p-4 font-normal">Mahsulot turi</th><th className="p-4 font-normal">Jami dona</th><th className="p-4 font-normal">UZS</th><th className="p-4 font-normal">USD</th><th className="p-4 text-right font-normal">Ochish</th></tr>
            </thead>
            <tbody>
              {summary.topWarehouses?.map((warehouse) => (
                <tr key={warehouse.id} className="border-t border-[#edf2f7]">
                  <td className="p-4 text-[#111827]">{warehouse.name}</td>
                  <td className="p-4 text-[#64748b]">{num(warehouse.productCount)} ta</td>
                  <td className="p-4 text-[#111827]">{num(warehouse.totalQuantity)} dona</td>
                  <td className="p-4 text-[#111827]">{money(warehouse.totalValueUZS || 0, "UZS")}</td>
                  <td className="p-4 text-[#111827]">{money(warehouse.totalValueUSD || 0, "USD")}</td>
                  <td className="p-4 text-right"><Link href={`/warehouses/${warehouse.id}`} className="text-[#315efb]">Ko‘rish</Link></td>
                </tr>
              ))}
              {!summary.topWarehouses?.length ? <tr><td colSpan={6} className="p-10 text-center text-[#8aa0ba]">Qoldiq yo‘q. Integrations → Omborlar → Tovarlar → Qoldiq bos.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[#64748b]">{label}</p><p className="mt-4 text-[24px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}
