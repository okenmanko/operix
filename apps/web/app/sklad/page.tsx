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

const copy = {
  uz: {
    title: "Sklad",
    subtitle: "Buxgalter uchun tovar qoldig‘i, prixod narxi va prodaja narxi.",
    products: "Tovarlar",
    stock: "Qoldiq",
    costTotal: "Prixod qiymati",
    saleTotal: "Sotuv qiymati",
    catalog: "Tovar katalogi",
    catalogHelp: "Kerakli ustunlar: nomi, model, kategoriya, shtrixkod, qoldiq, prixod va prodaja narxi.",
    search: "Tovar, model, shtrixkod yoki kategoriya...",
    category: "Kategoriya",
    allCategories: "Barcha kategoriyalar",
    stockFilter: "Qoldiq",
    all: "Hammasi",
    inStock: "Bor",
    zero: "0",
    minus: "Minus",
    product: "Tovar",
    model: "Model / SKU",
    barcode: "Shtrixkod",
    warehouse: "Ombor",
    reserve: "Rezerv",
    transit: "Yo‘lda",
    purchase: "Prixod narxi",
    sale: "Prodaja narxi",
    margin: "Farq",
    sum: "Summa",
    noProducts: "Tovar topilmadi.",
    noWarehouse: "Bu tovar bo‘yicha ombor qoldig‘i topilmadi.",
    loadError: "Sklad yuklanmadi",
  },
  ru: {
    title: "Склад",
    subtitle: "Остатки, закупочная цена и продажная цена для бухгалтера.",
    products: "Товары",
    stock: "Остаток",
    costTotal: "Закупочная стоимость",
    saleTotal: "Продажная стоимость",
    catalog: "Каталог товаров",
    catalogHelp: "Только нужные колонки: название, модель, категория, штрихкод, остаток, закупка и продажа.",
    search: "Товар, модель, штрихкод или категория...",
    category: "Категория",
    allCategories: "Все категории",
    stockFilter: "Остаток",
    all: "Все",
    inStock: "Есть",
    zero: "0",
    minus: "Минус",
    product: "Товар",
    model: "Модель / SKU",
    barcode: "Штрихкод",
    warehouse: "Склад",
    reserve: "Резерв",
    transit: "В пути",
    purchase: "Закупка",
    sale: "Продажа",
    margin: "Разница",
    sum: "Сумма",
    noProducts: "Товары не найдены.",
    noWarehouse: "Остатки по складам для этого товара не найдены.",
    loadError: "Склад не загрузился",
  },
  en: {
    title: "Stock",
    subtitle: "Inventory balance, purchase price and sale price for accounting.",
    products: "Products",
    stock: "Stock",
    costTotal: "Purchase value",
    saleTotal: "Sale value",
    catalog: "Product catalog",
    catalogHelp: "Only useful columns: name, model, category, barcode, stock, purchase and sale price.",
    search: "Product, model, barcode or category...",
    category: "Category",
    allCategories: "All categories",
    stockFilter: "Stock",
    all: "All",
    inStock: "In stock",
    zero: "Zero",
    minus: "Negative",
    product: "Product",
    model: "Model / SKU",
    barcode: "Barcode",
    warehouse: "Warehouse",
    reserve: "Reserve",
    transit: "In transit",
    purchase: "Purchase",
    sale: "Sale",
    margin: "Margin",
    sum: "Amount",
    noProducts: "No products found.",
    noWarehouse: "No warehouse stock found for this product.",
    loadError: "Stock could not be loaded",
  },
};

export default function SkladPage() {
  const { lang } = useI18n();
  const L = copy[(lang as keyof typeof copy) || "uz"] || copy.uz;

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
      setError(err instanceof Error ? err.message : L.loadError);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((item) => normalizeCategory(item.category)).filter(Boolean))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const cat = normalizeCategory(product.category);
      const stock = getStock(product);

      if (category !== "all" && cat !== category) return false;
      if (stockFilter === "inStock" && stock <= 0) return false;
      if (stockFilter === "zero" && stock !== 0) return false;
      if (stockFilter === "minus" && stock >= 0) return false;

      if (!q) return true;
      return [product.name, product.sku, product.barcode, product.category, cat]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, category, stockFilter]);

  const totalProducts = Number(summary.productsCount || summary.products || products.length || 0);
  const totalQuantity = Number(summary.totalQuantity || products.reduce((sum, product) => sum + getStock(product), 0));
  const totalCost = Number(summary.totalCostValueUSD || products.reduce((sum, product) => sum + getCostValue(product), 0));
  const totalSale = Number(summary.totalSaleValueUSD || summary.totalValue || products.reduce((sum, product) => sum + getSaleValue(product), 0));

  return (
    <AppLayout title={L.title} subtitle={L.subtitle}>
      {error ? (
        <div className="mb-5 rounded-[22px] bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={L.products} value={`${fmt(totalProducts)} ta`} />
        <Stat label={L.stock} value={`${fmt(totalQuantity)} dona`} />
        <Stat label={L.costTotal} value={usd(totalCost)} />
        <Stat label={L.saleTotal} value={usd(totalSale)} />
      </div>

      <section className="premium-card mt-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.05em] text-[var(--text)]">{L.catalog}</h2>
            <p className="mt-1 max-w-[760px] text-[13px] text-[var(--muted)]">{L.catalogHelp}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_220px_150px] gap-3 max-xl:grid-cols-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={L.search}
            className="premium-input h-11 w-full"
          />

          <select value={category} onChange={(event) => setCategory(event.target.value)} className="premium-input h-11 w-full">
            <option value="all">{L.allCategories}</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="premium-input h-11 w-full">
            <option value="all">{L.all}</option>
            <option value="inStock">{L.inStock}</option>
            <option value="zero">{L.zero}</option>
            <option value="minus">{L.minus}</option>
          </select>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] bg-[var(--card)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--line-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-[13px]">
              <thead className="bg-[var(--soft-card)] text-[10px] uppercase tracking-[0.13em] text-[var(--muted-2)]">
                <tr>
                  <th className="w-[28%] px-5 py-4 font-normal">{L.product}</th>
                  <th className="w-[13%] px-5 py-4 font-normal">{L.model}</th>
                  <th className="w-[13%] px-5 py-4 font-normal">{L.category}</th>
                  <th className="w-[13%] px-5 py-4 font-normal">{L.barcode}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{L.stock}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{L.purchase}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{L.sale}</th>
                  <th className="w-[9%] px-5 py-4 text-right font-normal">{L.margin}</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const qty = getStock(product);
                  const cost = getCost(product);
                  const sale = getSale(product);
                  const margin = sale - cost;
                  const isOpen = openId === product.id;
                  const categoryName = normalizeCategory(product.category);

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? "" : product.id)}
                        className="cursor-pointer border-t border-[var(--line-soft)] transition hover:bg-[var(--soft-card)]"
                      >
                        <td className="px-5 py-4">
                          <div className="line-clamp-2 max-w-[420px] font-semibold leading-5 text-[var(--text)]">{product.name || "—"}</div>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{product.sku || "—"}</td>
                        <td className="px-5 py-4 text-[var(--text)]">{categoryName || "—"}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">{product.barcode || "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{fmt(qty)} dona</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(cost)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[var(--text)]">{usd(sale)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-[var(--text)]">{usd(margin)}</td>
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
                                  <Mini label={L.warehouse} value={row.warehouseName || "—"} />
                                  <Mini label={L.stock} value={`${fmt(row.quantity || 0)} dona`} />
                                  <Mini label={L.reserve} value={`${fmt(row.reserve || 0)} dona`} />
                                  <Mini label={L.transit} value={`${fmt(row.inTransit || 0)} dona`} />
                                  <Mini label={L.purchase} value={usd(row.costPrice || cost)} />
                                  <Mini label={L.sale} value={usd(row.salePrice || sale)} />
                                  <Mini label={L.sum} value={usd(row.saleValue || row.value || 0)} />
                                  <Mini label={L.margin} value={usd((row.salePrice || sale) - (row.costPrice || cost))} />
                                </div>
                              ))}

                              {!product.warehouses?.length ? (
                                <div className="rounded-[18px] bg-[var(--card)] p-4 text-[13px] text-[var(--muted)] ring-1 ring-[var(--line-soft)]">
                                  {L.noWarehouse}
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
                    <td colSpan={8} className="p-10 text-center text-[var(--muted)]">{L.noProducts}</td>
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
      <p className="mt-4 whitespace-nowrap text-[25px] font-semibold tracking-[-0.055em] text-[var(--text)]">{value}</p>
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

function normalizeCategory(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
