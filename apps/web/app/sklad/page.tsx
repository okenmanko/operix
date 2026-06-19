"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  available?: number | null;
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

const dict = {
  uz: {
    title: "Sklad",
    subtitle: "MoySklad qoldiq hisoboti uslubida: tovar, qoldiq, rezerv, prixod va prodaja narxi.",
    goods: "Tovarlar",
    warehouses: "Omborlar",
    qty: "Qoldiq",
    value: "Sotuv qiymati",
    filter: "Filtr",
    search: "Tovar, kod, artikul yoki shtrixkod...",
    category: "Kategoriya",
    allCategories: "Barcha kategoriyalar",
    stockMode: "Qoldiq",
    all: "Hammasi",
    positive: "Bor",
    zero: "Nol",
    negative: "Minus",
    reset: "Tozalash",
    sync: "Sync sozlamalari",
    name: "Nomi",
    code: "Kod / Artikul",
    barcode: "Shtrixkod",
    stock: "Qoldiq",
    reserve: "Rezerv",
    transit: "Yo‘lda",
    available: "Mavjud",
    cost: "Prixod narxi",
    costSum: "Prixod summa",
    sale: "Prodaja narxi",
    saleSum: "Prodaja summa",
    warehouse: "Ombor",
    days: "Kun skladda",
    noItems: "Tovar topilmadi.",
    noWarehouse: "Bu tovar bo‘yicha ombor qoldiqlari topilmadi.",
    loadError: "Sklad yuklanmadi",
  },
  ru: {
    title: "Склад",
    subtitle: "Как отчет остатков в MoySklad: товар, остаток, резерв, закупка и продажная цена.",
    goods: "Товары",
    warehouses: "Склады",
    qty: "Остаток",
    value: "Сумма продажи",
    filter: "Фильтр",
    search: "Товар, код, артикул или штрихкод...",
    category: "Категория",
    allCategories: "Все категории",
    stockMode: "Остаток",
    all: "Все",
    positive: "Есть",
    zero: "Нулевой",
    negative: "Минус",
    reset: "Очистить",
    sync: "Настройки sync",
    name: "Наименование",
    code: "Код / Артикул",
    barcode: "Штрихкод",
    stock: "Остаток",
    reserve: "Резерв",
    transit: "Ожидание",
    available: "Доступно",
    cost: "Себестоимость",
    costSum: "Сумма себест.",
    sale: "Цена продажи",
    saleSum: "Сумма продажи",
    warehouse: "Склад",
    days: "Дней на складе",
    noItems: "Товары не найдены.",
    noWarehouse: "Остатки по складам для этого товара не найдены.",
    loadError: "Склад не загрузился",
  },
  en: {
    title: "Inventory",
    subtitle: "MoySklad-style stock report: product, balance, reserve, cost and sale price.",
    goods: "Products",
    warehouses: "Warehouses",
    qty: "Stock",
    value: "Sale value",
    filter: "Filter",
    search: "Product, code, SKU or barcode...",
    category: "Category",
    allCategories: "All categories",
    stockMode: "Stock",
    all: "All",
    positive: "In stock",
    zero: "Zero",
    negative: "Negative",
    reset: "Clear",
    sync: "Sync settings",
    name: "Name",
    code: "Code / SKU",
    barcode: "Barcode",
    stock: "Stock",
    reserve: "Reserve",
    transit: "Expected",
    available: "Available",
    cost: "Cost",
    costSum: "Cost total",
    sale: "Sale price",
    saleSum: "Sale total",
    warehouse: "Warehouse",
    days: "Days in stock",
    noItems: "No products found.",
    noWarehouse: "No warehouse balances found for this product.",
    loadError: "Inventory could not be loaded",
  },
};

export default function SkladPage() {
  const { lang } = useI18n();
  const L = dict[(lang as keyof typeof dict) || "uz"] || dict.uz;

  const [summary, setSummary] = useState<Summary>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stockMode, setStockMode] = useState("all");
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
      setError(err instanceof Error ? err.message : L.loadError);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => cleanText(p.category)).filter(Boolean))).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const cat = cleanText(product.category);
      const stock = qty(product);

      if (category !== "all" && cat !== category) return false;
      if (stockMode === "positive" && stock <= 0) return false;
      if (stockMode === "zero" && stock !== 0) return false;
      if (stockMode === "negative" && stock >= 0) return false;

      if (!q) return true;
      return [product.name, product.sku, product.barcode, product.category]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, category, stockMode]);

  const totalProducts = Number(summary.productsCount || summary.products || products.length || 0);
  const totalWarehouses = Number(summary.warehousesCount || summary.warehouses || 0);
  const totalQty = Number(summary.totalQuantity || products.reduce((s, p) => s + qty(p), 0));
  const totalSale = Number(summary.totalSaleValueUSD || summary.totalValue || products.reduce((s, p) => s + saleSum(p), 0));

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setStockMode("all");
  }

  return (
    <AppLayout title={L.title} subtitle={L.subtitle}>
      {error ? (
        <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-[14px] text-red-600 shadow-[var(--shadow-soft)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={L.goods} value={format(totalProducts)} />
        <Stat label={L.warehouses} value={format(totalWarehouses)} />
        <Stat label={L.qty} value={format(totalQty)} />
        <Stat label={L.value} value={usd(totalSale)} />
      </div>

      <section className="premium-card mt-5 overflow-hidden p-0">
        <div className="border-b border-[var(--line-soft)] px-5 py-4">
          <div className="grid grid-cols-[1fr_220px_160px_120px_140px] gap-3 max-2xl:grid-cols-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={L.search}
              className="premium-input h-11 w-full"
            />

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="premium-input h-11 w-full">
              <option value="all">{L.allCategories}</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={stockMode} onChange={(e) => setStockMode(e.target.value)} className="premium-input h-11 w-full">
              <option value="all">{L.all}</option>
              <option value="positive">{L.positive}</option>
              <option value="zero">{L.zero}</option>
              <option value="negative">{L.negative}</option>
            </select>

            <button onClick={resetFilters} className="premium-button h-11 w-full bg-[var(--soft-card)] text-[var(--text)] shadow-none">
              {L.reset}
            </button>

            <a href="/integrations" className="premium-button h-11 w-full bg-[var(--soft-card)] text-[var(--text)] shadow-none">
              {L.sync}
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-[13px]">
            <thead className="bg-[var(--soft-card)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              <tr>
                <th className="w-[25%] px-5 py-4 font-medium">{L.name}</th>
                <th className="w-[11%] px-5 py-4 font-medium">{L.code}</th>
                <th className="w-[12%] px-5 py-4 font-medium">{L.category}</th>
                <th className="w-[12%] px-5 py-4 font-medium">{L.barcode}</th>
                <th className="w-[8%] px-5 py-4 text-right font-medium">{L.stock}</th>
                <th className="w-[7%] px-5 py-4 text-right font-medium">{L.reserve}</th>
                <th className="w-[7%] px-5 py-4 text-right font-medium">{L.transit}</th>
                <th className="w-[8%] px-5 py-4 text-right font-medium">{L.cost}</th>
                <th className="w-[9%] px-5 py-4 text-right font-medium">{L.costSum}</th>
                <th className="w-[8%] px-5 py-4 text-right font-medium">{L.sale}</th>
                <th className="w-[9%] px-5 py-4 text-right font-medium">{L.saleSum}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((product) => {
                const isOpen = openId === product.id;
                const quantity = qty(product);
                const reserve = productReserve(product);
                const transit = productTransit(product);
                const cost = costPrice(product);
                const sale = salePrice(product);

                return (
                  <Fragment key={product.id}>
                    <tr
                      onClick={() => setOpenId(isOpen ? "" : product.id)}
                      className="cursor-pointer border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]"
                    >
                      <td className="px-5 py-4">
                        <div className="line-clamp-2 max-w-[390px] font-semibold leading-5 text-[var(--text)]">{product.name || "—"}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[var(--muted)]">{product.sku || "—"}</td>
                      <td className="px-5 py-4 text-[var(--text)]">{cleanText(product.category) || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[var(--muted)]">{product.barcode || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{format(quantity)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--muted)]">{format(reserve)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--muted)]">{format(transit)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(cost)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(costSum(product))}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(sale)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(saleSum(product))}</td>
                    </tr>

                    {isOpen ? (
                      <tr className="border-t border-[var(--line-soft)] bg-[var(--soft-card)]">
                        <td colSpan={11} className="px-5 py-4">
                          {(product.warehouses || []).length ? (
                            <div className="overflow-hidden rounded-[18px] bg-[var(--card)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)]">
                              <table className="w-full min-w-[980px] text-left text-[12px]">
                                <thead className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
                                  <tr>
                                    <th className="px-4 py-3 font-medium">{L.warehouse}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.stock}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.reserve}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.transit}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.available}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.days}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.cost}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.sale}</th>
                                    <th className="px-4 py-3 text-right font-medium">{L.saleSum}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(product.warehouses || []).map((row, idx) => (
                                    <tr key={`${product.id}-${row.warehouseName}-${idx}`} className="border-t border-[var(--line-soft)]">
                                      <td className="px-4 py-3 font-medium text-[var(--text)]">{row.warehouseName || "—"}</td>
                                      <td className="px-4 py-3 text-right text-[var(--text)]">{format(row.quantity)}</td>
                                      <td className="px-4 py-3 text-right text-[var(--muted)]">{format(row.reserve)}</td>
                                      <td className="px-4 py-3 text-right text-[var(--muted)]">{format(row.inTransit)}</td>
                                      <td className="px-4 py-3 text-right text-[var(--text)]">{format(row.available ?? row.quantity)}</td>
                                      <td className="px-4 py-3 text-right text-[var(--muted)]">{format(row.daysOnStock)}</td>
                                      <td className="px-4 py-3 text-right text-[var(--text)]">{usd(row.costPrice ?? cost)}</td>
                                      <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{usd(row.salePrice ?? sale)}</td>
                                      <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{usd(row.saleValue ?? row.value ?? 0)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="rounded-[18px] bg-[var(--card)] px-4 py-3 text-[13px] text-[var(--muted)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)]">
                              {L.noWarehouse}
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-[var(--muted)]">{L.noItems}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="mt-4 whitespace-nowrap text-[25px] font-semibold tracking-[-0.045em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function qty(product: Product) {
  return Number(product.stock ?? product.warehouses?.reduce((sum, row) => sum + Number(row.quantity || 0), 0) ?? 0);
}

function productReserve(product: Product) {
  return Number(product.reserve ?? product.warehouses?.reduce((sum, row) => sum + Number(row.reserve || 0), 0) ?? 0);
}

function productTransit(product: Product) {
  return Number(product.inTransit ?? product.warehouses?.reduce((sum, row) => sum + Number(row.inTransit || 0), 0) ?? 0);
}

function costPrice(product: Product) {
  return Number(product.costPrice || 0);
}

function salePrice(product: Product) {
  return Number(product.salePrice ?? product.price ?? 0);
}

function costSum(product: Product) {
  const q = qty(product);
  return Number(product.stockCostValueUSD || q * costPrice(product) || 0);
}

function saleSum(product: Product) {
  const q = qty(product);
  return Number(product.stockSaleValueUSD || product.stockValue || q * salePrice(product) || 0);
}

function format(value: any) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
}

function usd(value: any) {
  return `${format(value)} USD`;
}

function cleanText(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
