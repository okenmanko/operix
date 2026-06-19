"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  stock?: number | null;
  costPrice?: number | null;
  salePrice?: number | null;
  price?: number | null;
  stockCostValueUSD?: number | null;
  stockSaleValueUSD?: number | null;
  stockValue?: number | null;
  warehouses?: Array<{
    warehouseName: string;
    quantity: number;
    reserve?: number;
    inTransit?: number;
    daysOnStock?: number;
    costPrice?: number;
    salePrice?: number;
    costValue?: number;
    saleValue?: number;
    value?: number;
  }>;
};

type Warehouse = {
  id: string;
  name: string;
  productCount?: number;
  productTypes?: number;
  totalQuantity?: number;
  quantity?: number;
  totalValue?: number;
  value?: number;
};

type Summary = {
  products?: number;
  productsCount?: number;
  warehouses?: number;
  warehousesCount?: number;
  totalQuantity?: number;
  totalValue?: number;
  totalSaleValueUSD?: number;
};

export default function ProductsPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [summaryData, productData, warehouseData] = await Promise.all([
        apiJson<Summary>("/inventory/summary").catch(() => ({})),
        apiJson<Product[]>("/inventory/products").catch(() => []),
        apiJson<Warehouse[]>("/inventory/warehouses").catch(() => []),
      ]);

      setSummary(summaryData || {});
      setProducts(Array.isArray(productData) ? productData : []);
      setWarehouses(Array.isArray(warehouseData) ? warehouseData : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("skladLoadError"));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.barcode, product.category]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  const totalProducts = Number(summary.productsCount || summary.products || products.length || 0);
  const totalWarehouses = Number(summary.warehousesCount || summary.warehouses || warehouses.length || 0);
  const totalQuantity = Number(
    summary.totalQuantity || products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
  );
  const totalValue = Number(
    summary.totalSaleValueUSD ||
      summary.totalValue ||
      products.reduce((sum, product) => sum + Number(product.stockSaleValueUSD || product.stockValue || 0), 0),
  );

  return (
    <AppLayout title={t("products")} subtitle={t("productCatalogSubtitle")}>
      {error ? <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("productCount")} value={`${num(totalProducts)} ${t("pcsShort")}`} />
        <Stat label={t("warehouseCount")} value={`${num(totalWarehouses)} ${t("pcsShort")}`} />
        <Stat label={t("stockQty")} value={`${num(totalQuantity)} ${t("unitPcs")}`} />
        <Stat label={t("warehouseValue")} value={money(totalValue, "USD")} />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_320px] gap-5 max-2xl:grid-cols-1">
        <section className="premium-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.06em]">{t("productCatalog")}</h2>
              <p className="mt-1 text-[14px] text-[var(--muted)]">{t("productCatalogSubtitle")}</p>
            </div>

            <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchProductPlaceholder")}
                className="premium-input h-11 w-[300px] max-md:w-full"
              />
              <Link href="/integrations" className="premium-button premium-button-primary max-md:w-full">
                {t("syncMoySklad")}
              </Link>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-[var(--card)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] text-left text-[14px]">
                <thead className="bg-[var(--soft-card)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
                  <tr>
                    <th className="w-[320px] px-4 py-3 font-normal">{t("productName")}</th>
                    <th className="w-[160px] px-4 py-3 font-normal">{t("modelSku")}</th>
                    <th className="w-[160px] px-4 py-3 font-normal">{t("category")}</th>
                    <th className="w-[105px] px-4 py-3 text-right font-normal">{t("quantity")}</th>
                    <th className="w-[130px] px-4 py-3 text-right font-normal">{t("purchasePrice")}</th>
                    <th className="w-[130px] px-4 py-3 text-right font-normal">{t("salePrice")}</th>
                    <th className="w-[140px] px-4 py-3 text-right font-normal">{t("stockValue")}</th>
                    <th className="w-[90px] px-4 py-3 text-right font-normal">{t("details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const qty = Number(product.stock || 0);
                    const cost = Number(product.costPrice || 0);
                    const sale = Number(product.salePrice ?? product.price ?? 0);
                    const value = Number(product.stockSaleValueUSD || product.stockValue || qty * sale || 0);
                    const isOpen = openId === product.id;

                    return (
                      <Fragment key={product.id}>
                        <tr className="border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? "" : product.id)}
                              className="max-w-[300px] text-left font-semibold leading-5 text-[var(--text)]"
                            >
                              {product.name || "—"}
                            </button>
                            <p className="mt-1 text-[12px] text-[var(--muted)]">{product.barcode || t("noBarcode")}</p>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted)]">{product.sku || "—"}</td>
                          <td className="px-4 py-3 text-[var(--muted)]">{product.category || "—"}</td>
                          <td className="px-4 py-3 text-right font-medium">{num(qty)} {t("unitPcs")}</td>
                          <td className="px-4 py-3 text-right">{money(cost, "USD")}</td>
                          <td className="px-4 py-3 text-right font-semibold">{money(sale, "USD")}</td>
                          <td className="px-4 py-3 text-right font-semibold">{money(value, "USD")}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? "" : product.id)}
                              className="rounded-full bg-[var(--soft-card)] px-3 py-1 text-[12px] text-[var(--muted)]"
                            >
                              {isOpen ? "↑" : "↓"}
                            </button>
                          </td>
                        </tr>

                        {isOpen ? (
                          <tr className="border-t border-[var(--line-soft)] bg-[var(--soft-card)]">
                            <td colSpan={8} className="p-4">
                              <div className="grid gap-2">
                                {(product.warehouses || []).map((row, index) => (
                                  <div
                                    key={`${product.id}-${row.warehouseName}-${index}`}
                                    className="grid grid-cols-7 gap-3 rounded-[18px] bg-[var(--card)] px-4 py-3 text-[13px] max-xl:grid-cols-3 max-md:grid-cols-2"
                                  >
                                    <Mini label={t("warehouse")} value={row.warehouseName || "—"} />
                                    <Mini label={t("quantity")} value={`${num(row.quantity || 0)} ${t("unitPcs")}`} />
                                    <Mini label={t("reserve")} value={num(row.reserve || 0)} />
                                    <Mini label={t("inTransit")} value={num(row.inTransit || 0)} />
                                    <Mini label={t("purchasePrice")} value={money(row.costPrice || cost, "USD")} />
                                    <Mini label={t("salePrice")} value={money(row.salePrice || sale, "USD")} />
                                    <Mini label={t("stockValue")} value={money(row.saleValue || row.value || 0, "USD")} />
                                  </div>
                                ))}
                                {!product.warehouses?.length ? (
                                  <div className="rounded-[18px] bg-[var(--card)] p-4 text-[13px] text-[var(--muted)]">
                                    {t("noWarehouseForProduct")}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}

                  {!filteredProducts.length ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-[var(--muted)]">
                        {t("noProducts")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="premium-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.06em]">{t("warehouseList")}</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">{t("warehouseListSubtitle")}</p>
            </div>
            <Link href="/warehouses" className="premium-button premium-button-soft">
              {t("open")}
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {warehouses.slice(0, 10).map((warehouse) => (
              <Link
                key={warehouse.id}
                href={`/warehouses/${encodeURIComponent(warehouse.id)}`}
                className="block rounded-[22px] bg-[var(--soft-card)] p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold leading-5 text-[var(--text)]">{warehouse.name}</p>
                    <p className="mt-1 text-[12px] text-[var(--muted)]">
                      {num(warehouse.productCount || warehouse.productTypes || 0)} {t("productSmall")} · {money(warehouse.totalValue || warehouse.value || 0, "USD")}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[14px] font-semibold text-[var(--text)]">
                    {num(warehouse.totalQuantity || warehouse.quantity || 0)} {t("unitPcs")}
                  </span>
                </div>
              </Link>
            ))}

            {!warehouses.length ? (
              <div className="rounded-[22px] bg-[var(--soft-card)] p-5 text-[14px] text-[var(--muted)]">
                {t("noWarehouses")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="mt-4 whitespace-nowrap text-[27px] font-semibold tracking-[-0.06em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.13em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}
