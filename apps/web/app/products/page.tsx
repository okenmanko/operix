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

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.barcode,
        product.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const totalCost = products.reduce((sum, product) => sum + Number(product.stockCostValueUSD || 0), 0);
  const totalSale = products.reduce(
    (sum, product) => sum + Number(product.stockSaleValueUSD || product.stockValue || 0),
    0,
  );

  return (
    <AppLayout
      title="Products"
      subtitle="Mahsulotlar, tannarx, sotuv narxi, qoldiq va skladlar."
    >
      {error ? (
        <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Mahsulot turi" value={`${num(products.length)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(totalStock)} dona`} />
        <Stat label="Tannarx summa" value={money(totalCost, "USD")} />
        <Stat label="Sotuv summa" value={money(totalSale, "USD")} />
      </div>

      <div className="premium-card p-5">
        <div className="mb-5 flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
          <div>
            <h2 className="text-[23px] font-normal tracking-[-0.04em]">
              Mahsulotlar
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              Qator ustiga bosing — skladlar bo‘yicha qoldiq ochiladi.
            </p>
          </div>

          <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-11 w-[280px] rounded-[15px] border border-[var(--border)] bg-[var(--card)] px-4 text-[13px] text-[var(--text)] outline-none max-md:w-full"
            />
            <a
              href="/integrations"
              className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white shadow-[0_12px_26px_rgba(49,94,251,0.22)]"
            >
              MoySklad sync
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead className="bg-[var(--soft)] text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="w-[280px] px-4 py-3 font-normal">Mahsulot</th>
                  <th className="w-[150px] px-4 py-3 font-normal">SKU</th>
                  <th className="w-[130px] px-4 py-3 font-normal">Category</th>
                  <th className="w-[95px] px-4 py-3 text-right font-normal">Qoldiq</th>
                  <th className="w-[115px] px-4 py-3 text-right font-normal">Tannarx</th>
                  <th className="w-[115px] px-4 py-3 text-right font-normal">Sotuv</th>
                  <th className="w-[135px] px-4 py-3 text-right font-normal">Tannarx Σ</th>
                  <th className="w-[135px] px-4 py-3 text-right font-normal">Sotuv Σ</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((product) => {
                  const stock = Number(product.stock || 0);
                  const costPrice = Number(product.costPrice || 0);
                  const salePrice = Number(product.salePrice ?? product.price ?? 0);
                  const costValue = Number(product.stockCostValueUSD || stock * costPrice || 0);
                  const saleValue = Number(
                    product.stockSaleValueUSD || product.stockValue || stock * salePrice || 0,
                  );
                  const isOpen = openId === product.id;

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? "" : product.id)}
                        className="cursor-pointer border-t border-[var(--border)] transition hover:bg-[var(--soft)]"
                      >
                        <td className="px-4 py-3 text-[var(--text)]">
                          <div className="line-clamp-2 max-w-[260px] leading-5">
                            {product.name}
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--muted)]">
                            {product.barcode || "barcode yo‘q"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[var(--muted)]">
                          <span className="line-clamp-1 max-w-[130px]">
                            {product.sku || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-[var(--muted)]">
                          <span className="line-clamp-1 max-w-[120px]">
                            {product.category || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right text-[var(--text)]">
                          {num(stock)} dona
                        </td>

                        <td className="px-4 py-3 text-right text-[var(--text)]">
                          {money(costPrice, "USD")}
                        </td>

                        <td className="px-4 py-3 text-right text-[var(--text)]">
                          {money(salePrice, "USD")}
                        </td>

                        <td className="px-4 py-3 text-right text-[var(--text)]">
                          {money(costValue, "USD")}
                        </td>

                        <td className="px-4 py-3 text-right text-[var(--text)]">
                          {money(saleValue, "USD")}
                        </td>
                      </tr>

                      {isOpen ? (
                        <tr className="border-t border-[var(--border)] bg-[var(--soft)]">
                          <td colSpan={8} className="p-4">
                            <div className="grid gap-2">
                              {(product.warehouses || []).map((row, index) => (
                                <div
                                  key={`${row.warehouseName}-${index}`}
                                  className="grid grid-cols-8 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[12px] max-xl:grid-cols-4 max-md:grid-cols-2"
                                >
                                  <Mini label="Sklad" value={row.warehouseName || "Ombor"} />
                                  <Mini label="Qoldiq" value={`${num(row.quantity)} dona`} />
                                  <Mini label="Rezerv" value={num(row.reserve || 0)} />
                                  <Mini label="Yo‘lda" value={num(row.inTransit || 0)} />
                                  <Mini label="Kun" value={num(row.daysOnStock || 0)} />
                                  <Mini label="Tannarx" value={money(row.costPrice || costPrice, "USD")} />
                                  <Mini label="Sotuv" value={money(row.salePrice || salePrice, "USD")} />
                                  <Mini label="Summa" value={money(row.saleValue || row.value || 0, "USD")} />
                                </div>
                              ))}

                              {!product.warehouses?.length ? (
                                <p className="text-[13px] text-[var(--muted)]">
                                  Bu mahsulot bo‘yicha ombor qoldiq topilmadi.
                                </p>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}

                {!filtered.length ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-[var(--muted)]">
                      Mahsulot topilmadi.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-[25px] font-normal tracking-[-0.05em] text-[var(--text)]">
        {value}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 line-clamp-1 text-[13px] text-[var(--text)]">
        {value}
      </p>
    </div>
  );
}