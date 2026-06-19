"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Product = { id: string; name: string; sku?: string; barcode?: string; category?: string; stock?: number; salePrice?: number; price?: number; costPrice?: number; stockSaleValueUSD?: number; stockValue?: number };
type Warehouse = { id: string; name: string; productTypes?: number; totalQuantity?: number; totalValue?: number; quantity?: number; value?: number };
type Summary = { productsCount?: number; warehousesCount?: number; totalQuantity?: number; totalValue?: number; totalSaleValueUSD?: number };

export default function SkladPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    apiJson<Summary>("/inventory/summary").then((x) => setSummary(x || {})).catch(() => null);
    apiJson<Product[]>("/inventory/products").then((x) => setProducts(Array.isArray(x) ? x : [])).catch(() => null);
    apiJson<Warehouse[]>("/inventory/warehouses").then((x) => setWarehouses(Array.isArray(x) ? x : [])).catch(() => null);
  }, []);

  const totalQty = Number(summary.totalQuantity || products.reduce((s, p) => s + Number(p.stock || 0), 0));
  const totalValue = Number(summary.totalSaleValueUSD || summary.totalValue || products.reduce((s, p) => s + Number(p.stockSaleValueUSD || p.stockValue || 0), 0));
  const topProducts = useMemo(() => [...products].sort((a, b) => Number(b.stockSaleValueUSD || b.stockValue || 0) - Number(a.stockSaleValueUSD || a.stockValue || 0)).slice(0, 10), [products]);

  return (
    <AppLayout title={t("sklad")} subtitle={t("skladSubtitle")}>
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("productCount")} value={`${num(summary.productsCount || products.length)} ta`} />
        <Stat label={t("warehouseCount")} value={`${num(summary.warehousesCount || warehouses.length)} ta`} />
        <Stat label={t("stockQty")} value={`${num(totalQty)} dona`} />
        <Stat label={t("warehouseValue")} value={money(totalValue, "USD")} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link className="premium-button premium-button-soft" href="/products">{t("products")}</Link>
        <Link className="premium-button premium-button-soft" href="/warehouses">{t("warehouses")}</Link>
        <Link className="premium-button premium-button-soft" href="/inventory">{t("stockReport")}</Link>
        <Link className="premium-button premium-button-primary" href="/integrations">{t("syncMoySklad")}</Link>
      </div>

      <div className="mt-5 grid grid-cols-[1.25fr_0.75fr] gap-5 max-xl:grid-cols-1">
        <section className="premium-card p-6">
          <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("topProducts")}</h2>
          <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--line-soft)]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[var(--soft-card)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
                <tr><th className="px-4 py-3 font-normal">{t("product")}</th><th className="px-4 py-3 text-right font-normal">{t("quantity")}</th><th className="px-4 py-3 text-right font-normal">{t("salePrice")}</th><th className="px-4 py-3 text-right font-normal">{t("value")}</th></tr>
              </thead>
              <tbody>
                {topProducts.map((p) => {
                  const qty = Number(p.stock || 0);
                  const sale = Number(p.salePrice || p.price || 0);
                  const value = Number(p.stockSaleValueUSD || p.stockValue || qty * sale || 0);
                  return <tr key={p.id} className="border-t border-[var(--line-soft)]"><td className="px-4 py-3"><p className="font-semibold">{p.name}</p><p className="mt-1 text-[12px] text-[var(--muted)]">{p.sku || p.barcode || p.category || "—"}</p></td><td className="px-4 py-3 text-right">{num(qty)}</td><td className="px-4 py-3 text-right">{money(sale, "USD")}</td><td className="px-4 py-3 text-right font-semibold">{money(value, "USD")}</td></tr>;
                })}
                {!topProducts.length ? <tr><td colSpan={4} className="p-8 text-center text-[var(--muted)]">{t("noProducts")}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="premium-card p-6">
          <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("warehouses")}</h2>
          <div className="mt-5 space-y-3">
            {warehouses.slice(0, 8).map((w) => <Link key={w.id} href={`/warehouses/${w.id}`} className="qanot-row block p-4"><div className="flex items-center justify-between gap-4"><b className="font-semibold">{w.name}</b><span>{num(w.totalQuantity || w.quantity || 0)} dona</span></div><p className="mt-2 text-[13px] text-[var(--muted)]">{num(w.productTypes || 0)} {t("products")} · {money(w.totalValue || w.value || 0, "USD")}</p></Link>)}
            {!warehouses.length ? <div className="soft-card p-6 text-[var(--muted)]">{t("noWarehouses")}</div> : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-4 whitespace-nowrap text-[28px] font-semibold tracking-[-0.06em]">{value}</p></div>; }
