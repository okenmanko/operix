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
  reserve?: number | null;
  inTransit?: number | null;
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
    available?: number;
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
  totalCostValueUSD?: number;
  totalSaleValueUSD?: number;
};

const STOCK_FILTERS = [
  { key: "all", uz: "Hammasi", ru: "Все", en: "All" },
  { key: "inStock", uz: "Qoldiq bor", ru: "Есть остаток", en: "In stock" },
  { key: "zero", uz: "0 qoldiq", ru: "Нулевой", en: "Zero" },
  { key: "minus", uz: "Minus", ru: "Минус", en: "Negative" },
];

export default function SkladPage() {
  const { t, lang } = useI18n();
  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
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

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((item) => cleanCategory(item.category)).filter(Boolean))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const clean = cleanCategory(product.category);
      const stock = getStock(product);

      if (category !== "all" && clean !== category) return false;
      if (stockFilter === "inStock" && stock <= 0) return false;
      if (stockFilter === "zero" && stock !== 0) return false;
      if (stockFilter === "minus" && stock >= 0) return false;

      if (!q) return true;
      return [product.name, product.sku, product.barcode, product.category, clean]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, category, stockFilter]);

  const totalProducts = Number(summary.productsCount || summary.products || products.length || 0);
  const totalQuantity = Number(
    summary.totalQuantity || products.reduce((sum, product) => sum + getStock(product), 0),
  );
  const totalCost = Number(
    summary.totalCostValueUSD || products.reduce((sum, product) => sum + getCostValue(product), 0),
  );
  const totalSale = Number(
    summary.totalSaleValueUSD ||
      summary.totalValue ||
      products.reduce((sum, product) => sum + getSaleValue(product), 0),
  );
  const margin = totalSale - totalCost;

  return (
    <AppLayout
      title={t("sklad", "Sklad")}
      subtitle={t(
        "skladProSubtitle",
        "Tovar katalogi: prixod narxi, prodaja narxi, qoldiq va omborlar bo‘yicha real holat.",
      )}
    >
      {error ? (
        <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("products", "Tovarlar")} value={`${fmt(totalProducts)} ta`} />
        <Stat label={t("stockQty", "Qoldiq") } value={`${fmt(totalQuantity)} dona`} />
        <Stat label={t("purchaseTotal", "Prixod summa")} value={usd(totalCost)} />
        <Stat label={t("saleTotal", "Prodaja summa")} value={usd(totalSale)} />
        <Stat label={t("potentialMargin", "Potensial foyda")} value={usd(margin)} />
      </div>

      <section className="premium-card mt-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.05em] text-[var(--text)]">
              {t("productCatalog", "Tovar katalogi")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {t(
                "skladProHelp",
                "MoySklad qoldiq hisobotiga yaqin: nomi, model, kategoriya, qoldiq, prixod va prodaja narxi.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-lg:w-full">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchProductPlaceholder", "Tovar, model, shtrixkod yoki kategoriya...")}
              className="premium-input h-11 w-[340px] max-lg:flex-1 max-md:w-full"
            />
            <a
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-[16px] bg-[var(--soft-card)] px-4 text-[13px] font-medium text-[var(--text)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)] transition hover:translate-y-[-1px]"
            >
              {t("syncSettings", "Sync sozlamalari")}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Segment active={category === "all"} onClick={() => setCategory("all")}>
            {t("allCategories", "Barcha kategoriya")}
          </Segment>
          {categories.slice(0, 8).map((item) => (
            <Segment key={item} active={category === item} onClick={() => setCategory(item)}>
              {categoryIcon(item)} {item}
            </Segment>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {STOCK_FILTERS.map((item) => (
            <Segment key={item.key} active={stockFilter === item.key} onClick={() => setStockFilter(item.key)}>
              {lang === "ru" ? item.ru : lang === "en" ? item.en : item.uz}
            </Segment>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] bg-[var(--card)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-[13px]">
              <thead className="bg-[var(--soft-card)] text-[10px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
                <tr>
                  <th className="w-[25%] px-5 py-4 font-normal">{t("productName", "Tovar nomi")}</th>
                  <th className="w-[13%] px-5 py-4 font-normal">{t("modelSku", "Model / SKU")}</th>
                  <th className="w-[13%] px-5 py-4 font-normal">{t("category", "Kategoriya")}</th>
                  <th className="w-[11%] px-5 py-4 font-normal">{t("barcode", "Shtrixkod")}</th>
                  <th className="w-[8%] px-5 py-4 text-right font-normal">{t("quantity", "Qoldiq")}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{t("purchasePrice", "Prixod")}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{t("salePrice", "Prodaja")}</th>
                  <th className="w-[12%] px-5 py-4 text-right font-normal">{t("saleTotal", "Summa")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const qty = getStock(product);
                  const cost = getCost(product);
                  const sale = getSale(product);
                  const saleValue = getSaleValue(product);
                  const isOpen = openId === product.id;
                  const categoryName = cleanCategory(product.category);

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? "" : product.id)}
                        className="cursor-pointer border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]"
                      >
                        <td className="px-5 py-4">
                          <div className="line-clamp-2 max-w-[360px] font-semibold leading-5 text-[var(--text)]">
                            {product.name || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{product.sku || "—"}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--soft-card)] px-3 py-1 text-[12px] font-medium text-[var(--text)] ring-1 ring-[var(--line-soft)]">
                            {categoryIcon(categoryName)} {categoryName || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{product.barcode || "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">
                          {fmt(qty)} dona
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(cost)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(sale)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(saleValue)}</td>
                      </tr>

                      {isOpen ? (
                        <tr className="border-t border-[var(--line-soft)] bg-[var(--soft-card)]">
                          <td colSpan={8} className="p-4">
                            <div className="grid gap-2">
                              {(product.warehouses || []).map((row, index) => (
                                <div
                                  key={`${product.id}-${row.warehouseName}-${index}`}
                                  className="grid grid-cols-8 gap-3 rounded-[18px] bg-[var(--card)] px-4 py-3 text-[13px] ring-1 ring-[var(--line-soft)] max-xl:grid-cols-4 max-md:grid-cols-2"
                                >
                                  <Mini label={t("warehouse", "Ombor")} value={row.warehouseName || "—"} />
                                  <Mini label={t("quantity", "Qoldiq")} value={`${fmt(row.quantity || 0)} dona`} />
                                  <Mini label={t("reserve", "Rezerv")} value={`${fmt(row.reserve || 0)} dona`} />
                                  <Mini label={t("inTransit", "Yo‘lda")} value={`${fmt(row.inTransit || 0)} dona`} />
                                  <Mini label={t("daysOnStock", "Kun skladda")} value={fmt(row.daysOnStock || 0)} />
                                  <Mini label={t("purchasePrice", "Prixod")} value={usd(row.costPrice || cost)} />
                                  <Mini label={t("salePrice", "Prodaja")} value={usd(row.salePrice || sale)} />
                                  <Mini label={t("saleTotal", "Summa")} value={usd(row.saleValue || row.value || 0)} />
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
                    <td colSpan={8} className="p-10 text-center text-[var(--muted)]">
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
      <p className="mt-4 whitespace-nowrap text-[25px] font-semibold tracking-[-0.055em] text-[var(--text)]">
        {value}
      </p>
    </div>
  );
}

function Segment({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-[14px] px-4 text-[12px] font-medium transition ${
        active
          ? "bg-[#315efb] text-white shadow-[0_12px_24px_rgba(49,94,251,0.22)]"
          : "bg-[var(--card)] text-[var(--muted)] ring-1 ring-[var(--line-soft)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
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

function getStock(product: Product) {
  return Number(product.stock ?? product.warehouses?.reduce((sum, row) => sum + Number(row.quantity || 0), 0) ?? 0);
}

function getCost(product: Product) {
  return Number(product.costPrice || 0);
}

function getSale(product: Product) {
  return Number(product.salePrice ?? product.price ?? 0);
}

function getCostValue(product: Product) {
  const qty = getStock(product);
  const cost = getCost(product);
  return Number(product.stockCostValueUSD || qty * cost || 0);
}

function getSaleValue(product: Product) {
  const qty = getStock(product);
  const sale = getSale(product);
  return Number(product.stockSaleValueUSD || product.stockValue || qty * sale || 0);
}

function fmt(value: any) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
}

function usd(value: any) {
  return `${fmt(value)} USD`;
}

function categoryIcon(value: any) {
  const raw = String(value || "").toUpperCase();
  if (raw.includes("KONDIT") || raw.includes("КОНД")) return "❄️";
  if (raw.includes("TELEV") || raw.includes("TV") || raw.includes("ТЕЛЕ")) return "📺";
  if (raw.includes("KIR") || raw.includes("СТИР")) return "🧺";
  if (raw.includes("SOVUT") || raw.includes("ХОЛ") || raw.includes("МОРОЗ")) return "🧊";
  if (raw.includes("CHANG") || raw.includes("ПЫЛ")) return "🧹";
  if (raw.includes("OSHX") || raw.includes("МИКРО") || raw.includes("ПЛИТ")) return "🍳";
  if (raw.includes("AUDIO") || raw.includes("АУДИО")) return "🔊";
  if (raw.includes("KOMPY") || raw.includes("КОМП") || raw.includes("LAPTOP")) return "💻";
  return "📦";
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
