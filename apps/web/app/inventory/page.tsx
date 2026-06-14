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
  topWarehouses: Array<{
    id: string;
    name: string;
    productCount: number;
    totalQuantity: number;
    totalValue: number;
  }>;
};

export default function InventoryPage() {
  const [summary, setSummary] = useState<Summary>({
    products: 0,
    warehouses: 0,
    totalQuantity: 0,
    totalValue: 0,
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
    <AppLayout title="Inventory" subtitle="Mahsulotlar, omborlar, qoldiq va umumiy sklad qiymati.">
      {error ? (
        <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
      ) : null}

      <div className="mb-5 grid grid-cols-4 gap-4">
        <Stat label="Mahsulot turlari" value={`${num(summary.products)} ta`} />
        <Stat label="Omborlar" value={`${num(summary.warehouses)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(summary.totalQuantity)} dona`} />
        <Stat label="Jami summa" value={money(summary.totalValue, "USD")} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[24px] font-normal tracking-[-0.04em]">Omborlar kesimi</h2>
              <p className="mt-1 text-[13px] text-[#8aa0ba]">Ombor ustiga bosing — ichidagi mahsulotlar ochiladi.</p>
            </div>
            <Link href="/warehouses" className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white">
              Omborlar
            </Link>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[#edf2f7]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
                <tr>
                  <th className="p-4 font-normal">Ombor</th>
                  <th className="p-4 font-normal">Turi</th>
                  <th className="p-4 font-normal">Dona</th>
                  <th className="p-4 font-normal">Summa</th>
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
                    <td className="p-4 text-[#111827]">{money(item.totalValue, "USD")}</td>
                  </tr>
                ))}

                {!summary.topWarehouses?.length ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-[#8aa0ba]">
                      Ombor qoldiqlari yo‘q. Integratsiyalar → Sync all ni bosing.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card p-6">
          <h2 className="text-[24px] font-normal tracking-[-0.04em]">Tezkor amallar</h2>
          <p className="mt-1 text-[13px] text-[#8aa0ba]">Sklad bo‘yicha tekshirish.</p>

          <div className="mt-6 grid gap-3">
            <Link href="/integrations" className="flex h-14 items-center justify-between rounded-[18px] bg-[#eef4ff] px-5 text-[#315efb]">
              <span>MoySklad Sync all</span>
              <span>→</span>
            </Link>
            <Link href="/products" className="flex h-14 items-center justify-between rounded-[18px] bg-[#f8fafc] px-5 text-[#64748b]">
              <span>Productlar va sklad qoldiq</span>
              <span>→</span>
            </Link>
            <Link href="/warehouses" className="flex h-14 items-center justify-between rounded-[18px] bg-[#f8fafc] px-5 text-[#64748b]">
              <span>Omborlar ichidagi mahsulotlar</span>
              <span>→</span>
            </Link>
            <Link href="/sales" className="flex h-14 items-center justify-between rounded-[18px] bg-[#f8fafc] px-5 text-[#64748b]">
              <span>POS minus test</span>
              <span>→</span>
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
