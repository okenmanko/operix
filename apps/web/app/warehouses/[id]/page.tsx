"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../components/AppLayout";
import { apiJson, money, num } from "../../lib/api";

type Detail = {
  warehouse: { id: string; name: string; address?: string | null } | null;
  items: Array<{ productId: string; name: string; sku?: string; barcode?: string; quantity: number; price: number; value: number; currency?: string }>;
  totalQuantity: number;
  totalValue: number;
  totalValueUZS?: number;
  totalValueUSD?: number;
};

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [query, setQuery] = useState("");
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

  useEffect(() => { load(); }, [params.id]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (detail?.items || []).filter((item) =>
      item.name.toLowerCase().includes(q) ||
      String(item.sku || "").toLowerCase().includes(q) ||
      String(item.barcode || "").toLowerCase().includes(q),
    );
  }, [detail, query]);

  const totalUZS = detail?.totalValueUZS || 0;
  const totalUSD = detail?.totalValueUSD || 0;

  return (
    <AppLayout title={detail?.warehouse?.name || "Ombor"} subtitle="Ombor ichidagi aniq mahsulotlar, SKU, barcode, dona, narx va summa.">
      <Link href="/warehouses" className="mb-5 inline-flex h-11 items-center rounded-[15px] bg-[#f4f7fb] px-4 text-[13px] text-[#64748b]">← Omborlarga qaytish</Link>
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Mahsulot turi" value={`${num(detail?.items?.length || 0)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(detail?.totalQuantity || 0)} dona`} />
        <Stat label="UZS summa" value={money(totalUZS, "UZS")} />
        <Stat label="USD summa" value={money(totalUSD, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em]">Ombor ichidagi mahsulotlar</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qidiruv mahsulot nomi, SKU yoki barcode bo‘yicha ishlaydi.</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish..." className="premium-input w-full md:w-[320px]" />
        </div>

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-[#edf2f7]">
          <table className="w-full min-w-[860px] text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr><th className="p-4 font-normal">Mahsulot</th><th className="p-4 font-normal">SKU</th><th className="p-4 font-normal">Barcode</th><th className="p-4 font-normal">Dona</th><th className="p-4 font-normal">Narx</th><th className="p-4 font-normal">Summa</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const currency = item.currency === "USD" ? "USD" : "UZS";
                return (
                  <tr key={`${item.productId}-${item.name}-${item.sku}-${item.barcode}-${currency}`} className="border-t border-[#edf2f7]">
                    <td className="p-4 text-[#111827]">{item.name}</td>
                    <td className="p-4 text-[#64748b]">{item.sku || "—"}</td>
                    <td className="p-4 text-[#64748b]">{item.barcode || "—"}</td>
                    <td className="p-4 text-[#111827]">{num(item.quantity)} dona</td>
                    <td className="p-4 text-[#111827]">{money(item.price, currency)}</td>
                    <td className="p-4 text-[#111827]">{money(item.value, currency)}</td>
                  </tr>
                );
              })}
              {!filtered.length ? <tr><td colSpan={6} className="p-10 text-center text-[#8aa0ba]">Bu omborda qoldiq topilmadi. Integrations → Omborlar → Tovarlar → Qoldiq bos.</td></tr> : null}
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
