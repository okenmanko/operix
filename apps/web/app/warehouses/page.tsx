"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Warehouse = {
  id: string;
  name: string;
  address?: string | null;
  productCount: number;
  totalQuantity: number;
  totalValue?: number;
  totalValueUZS?: number;
  totalValueUSD?: number;
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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

  return (
    <AppLayout title="Omborlar" subtitle="Skladlar bo‘yicha mahsulot soni, dona va UZS/USD qiymat.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {warehouses.map((warehouse) => (
          <Link key={warehouse.id} href={`/warehouses/${warehouse.id}`} className="premium-card block p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[#111827]">{warehouse.name}</h2>
                <p className="mt-2 text-[13px] text-[#8aa0ba]">{warehouse.address || "Manzil kiritilmagan"}</p>
              </div>
              <span className="rounded-full bg-[#eef4ff] px-4 py-2 text-[12px] text-[#315efb]">Ko‘rish</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Mini label="Tovar" value={`${num(warehouse.productCount)} ta`} />
              <Mini label="Dona" value={`${num(warehouse.totalQuantity)} dona`} />
              <Mini label="UZS" value={money(warehouse.totalValueUZS || 0, "UZS")} />
              <Mini label="USD" value={money(warehouse.totalValueUSD || 0, "USD")} />
            </div>
          </Link>
        ))}
      </div>

      {!warehouses.length ? <div className="premium-card p-10 text-center text-[#8aa0ba]">Ombor topilmadi. Integrations → Omborlar sync bos.</div> : null}
    </AppLayout>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] bg-[#f8fafc] p-4"><p className="text-[12px] text-[#8aa0ba]">{label}</p><p className="mt-2 text-[16px] text-[#111827]">{value}</p></div>;
}
