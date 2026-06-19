"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
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

type Summary = {
  products?: number;
  productsCount?: number;
  warehouses?: number;
  warehousesCount?: number;
  totalQuantity?: number;
  totalValue?: number;
  totalSaleValueUSD?: number;
};

export default function SkladPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [summaryData, productData] = await Promise.all([
        apiJson<Summary>("/inventory/summary").catch(() => ({})),
        apiJson<Product[]>("/inventory/products").catch(() => []),
      ]);

      setSummary(summaryData || {});
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("skladLoadError", "Sklad yuklanmadi"));
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
  const totalQuantity = Number(
    summary.totalQuantity || products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
  );
  const totalValue = Number(
    summary.totalSaleValueUSD ||
      summary.totalValue ||
      products.reduce((sum, product) => sum + Number(product.stockSaleValueUSD || product.stockValue || 0), 0),
  );
  const categoryCount = new Set(products.map((item) => cleanCategory(item.category)).filter(Boolean)).size;

  return (
    <AppLayout
      title={t("sklad", "Sklad")}
      subtitle={t(
        "skladSubtitleFinal",
        "Tovar katalogi: nomi, modeli, kategoriyasi, prixod narxi, sotuv narxi va qoldiq.",
      )}
    >
      {error ? (
        <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("productCount", "Tovarlar")} value={`${fmt(totalProducts)} ta`} />
        <Stat label={t("category", "Kategoriya")} value={`${fmt(categoryCount)} ta`} />
        <Stat label={t("stockQty", "Qoldiq") } value={`${fmt(totalQuantity)} dona`} />
        <Stat label={t("warehouseValue", "Sklad qiymati")} value={usd(totalValue)} />
      </div>

      <section className="premium-card mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.055em] text-[var(--text)]">
              {t("productCatalog", "Tovar katalogi")}
            </h2>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              {t("productCatalogSubtitleFinal", "Faqat kerakli ustunlar: tovar, model, kategoriya, qoldiq, prixod va sotuv narxi.")}
            </p>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchProductPlaceholder", "Tovar, model, shtrixkod yoki kategoriya...")}
            className="premium-input h-11 w-[360px] max-md:w-full"
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] bg-[var(--card)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[14px]">
              <thead className="bg-[var(--soft-card)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
                <tr>
                  <th className="w-[34%] px-5 py-4 font-normal">{t("productName", "Tovar nomi")}</th>
                  <th className="w-[16%] px-5 py-4 font-normal">{t("modelSku", "Model / SKU")}</th>
                  <th className="w-[16%] px-5 py-4 font-normal">{t("category", "Kategoriya")}</th>
                  <th className="w-[10%] px-5 py-4 text-right font-normal">{t("quantity", "Qoldiq")}</th>
                  <th className="w-[12%] px-5 py-4 text-right font-normal">{t("purchasePrice", "Prixod")}</th>
                  <th className="w-[12%] px-5 py-4 text-right font-normal">{t("salePrice", "Sotuv")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const qty = Number(product.stock || 0);
                  const cost = Number(product.costPrice || 0);
                  const sale = Number(product.salePrice ?? product.price ?? 0);
                  const isOpen = openId === product.id;
                  const category = cleanCategory(product.category);

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? "" : product.id)}
                        className="cursor-pointer border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]"
                      >
                        <td className="px-5 py-4">
                          <div className="line-clamp-2 max-w-[440px] font-semibold leading-5 text-[var(--text)]">
                            {product.name || "—"}
                          </div>
                          <div className="mt-1 text-[12px] text-[var(--muted)]">
                            {product.barcode || t("noBarcode", "Shtrixkod yo‘q")}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{product.sku || "—"}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-[var(--soft-card)] px-3 py-1 text-[12px] font-medium text-[var(--text)] ring-1 ring-[var(--line-soft)]">
                            {category || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">
                          {fmt(qty)} dona
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(cost)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(sale)}</td>
                      </tr>

                      {isOpen ? (
                        <tr className="border-t border-[var(--line-soft)] bg-[var(--soft-card)]">
                          <td colSpan={6} className="p-4">
                            <div className="grid gap-2">
                              {(product.warehouses || []).map((row, index) => (
                                <div
                                  key={`${product.id}-${row.warehouseName}-${index}`}
                                  className="grid grid-cols-5 gap-3 rounded-[18px] bg-[var(--card)] px-4 py-3 text-[13px] ring-1 ring-[var(--line-soft)] max-lg:grid-cols-2"
                                >
                                  <Mini label={t("warehouse", "Ombor")} value={row.warehouseName || "—"} />
                                  <Mini label={t("quantity", "Qoldiq")} value={`${fmt(row.quantity || 0)} dona`} />
                                  <Mini label={t("purchasePrice", "Prixod")} value={usd(row.costPrice || cost)} />
                                  <Mini label={t("salePrice", "Sotuv")} value={usd(row.salePrice || sale)} />
                                  <Mini label={t("stockValue", "Qiymat")} value={usd(row.saleValue || row.value || 0)} />
                                </div>
                              ))}

                              {!product.warehouses?.length ? (
                                <div className="rounded-[18px] bg-[var(--card)] p-4 text-[13px] text-[var(--muted)] ring-1 ring-[var(--line-soft)]">
                                  {t("noWarehouseForProduct", "Bu tovar bo‘yicha ombor qoldiq topilmadi.")}
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
                    <td colSpan={6} className="p-10 text-center text-[var(--muted)]">
                      {t("noProducts", "Tovar topilmadi.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="mt-4 whitespace-nowrap text-[27px] font-semibold tracking-[-0.055em] text-[var(--text)]">
        {value}
      </p>
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

function fmt(value: any) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
}

function usd(value: any) {
  return `${fmt(value)} USD`;
}

function cleanCategory(value: any) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();

  if (!raw) return "";
  if (upper.includes("КОНД") || upper.includes("CONDITION") || upper.includes("KOND")) return "Konditsioner";
  if (upper.includes("ТЕЛЕ") || upper.includes("TV") || upper.includes("LED")) return "Televizor";
  if (upper.includes("СТИР") || upper.includes("KIR") || upper.includes("WASH")) return "Kir yuvish";
  if (upper.includes("ХОЛ") || upper.includes("МОРОЗ") || upper.includes("FRIDGE")) return "Sovutgich";
  if (upper.includes("ПЫЛ") || upper.includes("CHANG") || upper.includes("VACUUM")) return "Changyutgich";
  if (upper.includes("МИКРО") || upper.includes("ДУХ") || upper.includes("ПЛИТ") || upper.includes("OSHX")) return "Oshxona";
  if (upper.includes("АУДИО") || upper.includes("SOUND") || upper.includes("KALONKA")) return "Audio";
  if (upper.includes("КОМП") || upper.includes("NOTEBOOK") || upper.includes("LAPTOP")) return "Kompyuter";

  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
