"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  costPrice?: number | null;
  salePrice?: number | null;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  stockValue?: number | null;
  stockCostValueUSD?: number | null;
  stockSaleValueUSD?: number | null;
  warehouses?: Array<{
    warehouseName: string;
    quantity: number;
    reserve?: number;
    inTransit?: number;
    available?: number;
    daysOnStock?: number;
    costPrice?: number;
    salePrice?: number;
    costValue?: number;
    saleValue?: number;
    value: number;
  }>;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Product[]>("/inventory/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Productlar yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((product) =>
      product.name?.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q) ||
      product.barcode?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q),
    );
  }, [products, query]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const totalCost = products.reduce((sum, product) => sum + Number(product.stockCostValueUSD || 0), 0);
  const totalSale = products.reduce((sum, product) => sum + Number(product.stockSaleValueUSD || product.stockValue || 0), 0);

  return (
    <AppLayout title="Products" subtitle="Mahsulotlar, tannarx, sotuv narxi, qoldiq va qaysi skladda ekanligi.">
      {error ? <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Mahsulot turi" value={`${num(products.length)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(totalStock)} dona`} />
        <Stat label="Tannarx summa" value={money(totalCost, "USD")} />
        <Stat label="Sotuv summa" value={money(totalSale, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em]">Mahsulotlar</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qator ustiga bosing — qaysi skladda nechta borligi, tannarx va sotuv narxi ochiladi.</p>
          </div>

          <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish..." className="h-11 w-[280px] rounded-[15px] border border-[#dfe8f3] bg-white px-4 text-[13px] outline-none max-md:w-full" />
            <a href="/integrations" className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white shadow-[0_12px_26px_rgba(49,94,251,0.22)]">MoySklad sync</a>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[22px] border border-[#edf2f7]">
          <table className="w-full min-w-[1180px] text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Nomi</th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">Barcode</th>
                <th className="p-4 font-normal">Category</th>
                <th className="p-4 font-normal">Qoldiq</th>
                <th className="p-4 font-normal">Tannarx</th>
                <th className="p-4 font-normal">Sotuv narxi</th>
                <th className="p-4 font-normal">Tannarx summa</th>
                <th className="p-4 font-normal">Sotuv summa</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const stock = Number(product.stock || 0);
                const costPrice = Number(product.costPrice || 0);
                const salePrice = Number(product.salePrice ?? product.price ?? 0);
                const costValue = Number(product.stockCostValueUSD || stock * costPrice || 0);
                const saleValue = Number(product.stockSaleValueUSD || product.stockValue || stock * salePrice || 0);
                const isOpen = openId === product.id;
                return (
                  <Fragment key={product.id}>
                    <tr onClick={() => setOpenId(isOpen ? "" : product.id)} className="cursor-pointer border-t border-[#edf2f7] transition hover:bg-[#f8fafc]">
                      <td className="p-4 text-[#111827]">{product.name}</td>
                      <td className="p-4 text-[#64748b]">{product.sku || "—"}</td>
                      <td className="p-4 text-[#64748b]">{product.barcode || "—"}</td>
                      <td className="p-4 text-[#64748b]">{product.category || "—"}</td>
                      <td className="p-4 text-[#111827]">{num(stock)} dona</td>
                      <td className="p-4 text-[#111827]">{money(costPrice, "USD")}</td>
                      <td className="p-4 text-[#111827]">{money(salePrice, "USD")}</td>
                      <td className="p-4 text-[#111827]">{money(costValue, "USD")}</td>
                      <td className="p-4 text-[#111827]">{money(saleValue, "USD")}</td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-t border-[#edf2f7] bg-[#fbfdff]">
                        <td colSpan={9} className="p-4">
                          <div className="grid gap-2">
                            {(product.warehouses || []).map((row, index) => (
                              <div key={`${row.warehouseName}-${index}`} className="grid grid-cols-7 gap-3 rounded-[16px] bg-white px-4 py-3 text-[13px] max-lg:grid-cols-2">
                                <span className="text-[#111827]">{row.warehouseName || "Ombor"}</span>
                                <span>{num(row.quantity)} dona</span>
                                <span>Rezerv: {num(row.reserve || 0)}</span>
                                <span>Yo‘lda: {num(row.inTransit || 0)}</span>
                                <span>Tannarx: {money(row.costPrice || costPrice, "USD")}</span>
                                <span>Sotuv: {money(row.salePrice || salePrice, "USD")}</span>
                                <span>Summa: {money(row.saleValue || row.value || 0, "USD")}</span>
                              </div>
                            ))}
                            {!product.warehouses?.length ? <p className="text-[#8aa0ba]">Bu mahsulot bo‘yicha ombor qoldiq topilmadi.</p> : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!filtered.length ? <tr><td colSpan={9} className="p-10 text-center text-[#8aa0ba]">Mahsulot topilmadi.</td></tr> : null}
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
