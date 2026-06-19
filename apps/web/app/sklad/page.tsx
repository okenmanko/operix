"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Summary = {
  products?: number;
  warehouses?: number;
  totalQuantity?: number;
  totalValueUSD?: number;
  totalValueUZS?: number;
  totalValue?: number;
  topWarehouses?: Array<{ id?: string; name?: string; productCount?: number; totalQuantity?: number; totalValueUSD?: number; totalValue?: number }>;
};

type Product = { id: string; name: string; stock?: number; salePrice?: number; costPrice?: number; stockSaleValueUSD?: number; stockValue?: number; currency?: string };

export default function SkladPage() {
  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [s, p] = await Promise.all([
        apiJson<Summary>("/inventory/summary"),
        apiJson<Product[]>("/inventory/products").catch(() => []),
      ]);
      setSummary(s || {});
      setProducts(Array.isArray(p) ? p : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sklad yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  const topProducts = products
    .slice()
    .sort((a, b) => Number(b.stockSaleValueUSD || b.stockValue || 0) - Number(a.stockSaleValueUSD || a.stockValue || 0))
    .slice(0, 10);

  return (
    <AppLayout title="Sklad" subtitle="Mahsulot, ombor, qoldiq, tannarx va sotuv narxi bitta markazda.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Mahsulot" value={`${num(summary.products || 0)} ta`} />
        <Stat label="Ombor" value={`${num(summary.warehouses || 0)} ta`} />
        <Stat label="Qoldiq" value={`${num(summary.totalQuantity || 0)} dona`} />
        <Stat label="Sklad qiymati" value={money(summary.totalValueUSD || summary.totalValue || 0, "USD")} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/products" className="qanot-pill">Mahsulotlar</Link>
        <Link href="/warehouses" className="qanot-pill">Omborlar</Link>
        <Link href="/inventory" className="qanot-pill">Qoldiq</Link>
        <Link href="/integrations" className="qanot-pill">MoySklad sync</Link>
      </div>

      <div className="grid grid-cols-[1.15fr_.85fr] gap-4 max-xl:grid-cols-1">
        <section className="premium-card p-5">
          <h2 className="mb-4 text-[24px] font-medium tracking-[-0.06em]">Top mahsulotlar</h2>
          <div className="qanot-table-wrap overflow-hidden rounded-[18px] border border-[var(--line)]">
            <table className="qanot-table">
              <thead>
                <tr>
                  <th className="text-left">Mahsulot</th>
                  <th className="text-right">Qoldiq</th>
                  <th className="text-right">Sotuv narxi</th>
                  <th className="text-right">Qiymat</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td className="text-right">{num(product.stock || 0)}</td>
                    <td className="text-right">{money(product.salePrice || 0, "USD")}</td>
                    <td className="text-right">{money(product.stockSaleValueUSD || product.stockValue || 0, "USD")}</td>
                  </tr>
                ))}
                {!topProducts.length ? <tr><td colSpan={4} className="text-center text-[var(--muted)]">Mahsulotlar yo‘q.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="premium-card p-5">
          <h2 className="mb-4 text-[24px] font-medium tracking-[-0.06em]">Omborlar</h2>
          <div className="space-y-2">
            {(summary.topWarehouses || []).slice(0, 8).map((warehouse) => (
              <Link key={warehouse.id || warehouse.name} href={warehouse.id ? `/warehouses/${warehouse.id}` : "/warehouses"} className="block rounded-[16px] border border-[var(--line)] bg-[var(--soft-card)] px-4 py-3 transition hover:bg-[var(--hover)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-[var(--text)]">{warehouse.name || "Ombor"}</span>
                  <span className="text-[13px] text-[var(--muted)]">{num(warehouse.totalQuantity || 0)} dona</span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--muted-2)]">{num(warehouse.productCount || 0)} mahsulot • {money(warehouse.totalValueUSD || warehouse.totalValue || 0, "USD")}</p>
              </Link>
            ))}
            {!(summary.topWarehouses || []).length ? <p className="text-[13px] text-[var(--muted)]">Omborlar topilmadi.</p> : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-3 text-[24px] font-medium tracking-[-0.06em]">{value}</p></div>;
}
