"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../../components/AppLayout";
import { apiJson, money, num } from "../../lib/api";

type Detail = {
  warehouse: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
  items: Array<{
    productId: string;
    name: string;
    sku?: string;
    barcode?: string;
    quantity: number;
    price: number;
    value: number;
    currency?: string;
  }>;
  totalQuantity: number;
  totalValue: number;
  totalValueUZS?: number;
  totalValueUSD?: number;
};

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Detail>(`/inventory/warehouses/${encodeURIComponent(params.id)}`);
      setDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ombor yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const totalUZS = detail?.totalValueUZS || 0;
  const totalUSD = detail?.totalValueUSD || 0;

  return (
    <AppLayout title={detail?.warehouse?.name || "Ombor"} subtitle="Ombor ichidagi mahsulotlar, dona va summa.">
      <Link href="/warehouses" className="mb-5 inline-flex h-11 items-center rounded-[15px] bg-[#f4f7fb] px-4 text-[13px] text-[#64748b]">
        ← Omborlarga qaytish
      </Link>

      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4">
        <Stat label="Mahsulot turi" value={`${num(detail?.items?.length || 0)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(detail?.totalQuantity || 0)} dona`} />
        <Stat label="UZS summa" value={money(totalUZS, "UZS")} />
        <Stat label="USD summa" value={money(totalUSD, "USD")} />
      </div>

      <div className="premium-card p-6">
        <h2 className="text-[24px] font-normal tracking-[-0.04em]">Ombor ichidagi mahsulotlar</h2>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mahsulot</th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">Barcode</th>
                <th className="p-4 font-normal">Dona</th>
                <th className="p-4 font-normal">Narx</th>
                <th className="p-4 font-normal">Summa</th>
              </tr>
            </thead>
            <tbody>
              {detail?.items?.map((item) => {
                const currency = item.currency === "USD" ? "USD" : "UZS";
                return (
                  <tr key={`${item.productId}-${item.name}-${item.sku}-${item.barcode}`} className="border-t border-[#edf2f7]">
                    <td className="p-4 text-[#111827]">{item.name}</td>
                    <td className="p-4 text-[#64748b]">{item.sku || "—"}</td>
                    <td className="p-4 text-[#64748b]">{item.barcode || "—"}</td>
                    <td className="p-4 text-[#111827]">{num(item.quantity)} dona</td>
                    <td className="p-4 text-[#111827]">{money(item.price, currency)}</td>
                    <td className="p-4 text-[#111827]">{money(item.value, currency)}</td>
                  </tr>
                );
              })}

              {!detail?.items?.length ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#8aa0ba]">
                    Bu omborda qoldiq topilmadi. Integratsiyalar → Qoldiq yoki Sync all ni qayta bosing.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
