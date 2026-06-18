"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Summary = {
  products: number;
  warehouses: number;
  totalQuantity: number;
  totalValue: number;
  totalCostValueUSD?: number;
  totalSaleValueUSD?: number;
  topWarehouses: Array<{
    id: string;
    name: string;
    productCount: number;
    totalQuantity: number;
    totalValue: number;
    totalCostValueUSD?: number;
    totalSaleValueUSD?: number;
  }>;
};

export default function InventoryPage() {
  const [summary, setSummary] = useState<Summary>({
    products: 0,
    warehouses: 0,
    totalQuantity: 0,
    totalValue: 0,
    totalCostValueUSD: 0,
    totalSaleValueUSD: 0,
    topWarehouses: [],
  });
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

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Inventory" subtitle="MoySklad qoldiq: mahsulot, ombor, tannarx, sotuv narxi va umumiy qiymat.">
      {error ? (
        <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
      ) : null}

      <div className="mb-5 grid grid-cols-5 gap-4 max-xl:grid-cols-3 max-md:grid-cols-1">
        <Stat label="Mahsulot turlari" value={`${num(summary.products)} ta`} />
        <Stat label="Omborlar" value={`${num(summary.warehouses)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(summary.totalQuantity)} dona`} />
        <Stat label="Tannarx summa" value={money(summary.totalCostValueUSD || 0, "USD")} />
        <Stat label="Sotuv summa" value={money(summary.totalSaleValueUSD || summary.totalValue || 0, "USD")} />
      </div>

      <div className="grid grid-cols-[1.35fr_0.65fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-normal tracking-[-0.04em]">Omborlar bo‘yicha qoldiq</h2>
              <p className="mt-1 text-[13px] text-[#8aa0ba]">Har bir skladda nechta mahsulot, tannarx va sotuv summasi bor.</p>
            </div>
            <Link href="/warehouses" className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white">
              Omborlar
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[20px] border border-[#edf2f7]">
            <table className="w-full min-w-[860px] text-left text-[14px]">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
                <tr>
                  <th className="p-4 font-normal">Ombor</th>
                  <th className="p-4 font-normal">Mahsulot turi</th>
                  <th className="p-4 font-normal">Jami dona</th>
                  <th className="p-4 font-normal">Tannarx summa</th>
                  <th className="p-4 font-normal">Sotuv summa</th>
                  <th className="p-4 font-normal">Ochish</th>
                </tr>
              </thead>
              <tbody>
                {summary.topWarehouses?.map((item) => (
                  <tr key={item.id} className="border-t border-[#edf2f7]">
                    <td className="p-4">
                      <Link href={`/warehouses/${encodeURIComponent(item.id)}`} className="text-[#111827] hover:text-[#315efb]">
                        {item.name}
                      </Link>
                    </td>
                    <td className="p-4 text-[#64748b]">{num(item.productCount)} ta</td>
                    <td className="p-4 text-[#111827]">{num(item.totalQuantity)} dona</td>
                    <td className="p-4 text-[#111827]">{money(item.totalCostValueUSD || 0, "USD")}</td>
                    <td className="p-4 text-[#111827]">{money(item.totalSaleValueUSD || item.totalValue || 0, "USD")}</td>
                    <td className="p-4"><Link href={`/warehouses/${encodeURIComponent(item.id)}`} className="text-[#315efb]">Ko‘rish</Link></td>
                  </tr>
                ))}

                {!summary.topWarehouses?.length ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#8aa0ba]">
                      Ombor qoldiqlari yo‘q. Integratsiyalar → Qoldiq yoki Sync all ni bosing.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card p-6">
          <h2 className="text-[24px] font-normal tracking-[-0.04em]">Tezkor amallar</h2>
          <p className="mt-1 text-[13px] text-[#8aa0ba]">MoySklad qoldiq va mahsulotlarni qayta yuklash.</p>

          <div className="mt-6 grid gap-3">
            <Link href="/integrations" className="flex h-14 items-center justify-between rounded-[18px] bg-[#eef4ff] px-5 text-[#315efb]">
              <span>MoySklad Sync all</span><span>→</span>
            </Link>
            <Link href="/products" className="flex h-14 items-center justify-between rounded-[18px] bg-[#f8fafc] px-5 text-[#64748b]">
              <span>Mahsulotlar: tannarx + sotuv</span><span>→</span>
            </Link>
            <Link href="/warehouses" className="flex h-14 items-center justify-between rounded-[18px] bg-[#f8fafc] px-5 text-[#64748b]">
              <span>Omborlar ichidagi mahsulotlar</span><span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[#64748b]">{label}</p>
      <p className="mt-4 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p>
    </div>
  );
}
