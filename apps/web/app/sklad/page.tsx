"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

type WarehouseRow = {
  warehouseName?: string;
  quantity?: number;
  reserve?: number;
  inTransit?: number;
  available?: number;
  daysOnStock?: number;
  costPrice?: number;
  salePrice?: number;
  costValue?: number;
  saleValue?: number;
  value?: number;
};

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  costPrice?: number | null;
  salePrice?: number | null;
  price?: number | null;
  stock?: number | null;
  reserve?: number | null;
  inTransit?: number | null;
  stockCostValueUSD?: number | null;
  stockSaleValueUSD?: number | null;
  stockValue?: number | null;
  warehouses?: WarehouseRow[];
};

const stockFilters = ["all", "in", "zero", "negative"] as const;

export default function SkladPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<(typeof stockFilters)[number]>("all");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Product[]>("/inventory/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sklad yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      const matchesQuery = !q || [p.name, p.sku, p.barcode, p.category].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.category === category;
      const matchesStock = stockFilter === "all" || (stockFilter === "in" && stock > 0) || (stockFilter === "zero" && stock === 0) || (stockFilter === "negative" && stock < 0);
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, category, stockFilter]);

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const totalSale = products.reduce((sum, p) => sum + Number(p.stockSaleValueUSD || p.stockValue || 0), 0);
  const warehouseNames = new Set<string>();
  products.forEach((p) => (p.warehouses || []).forEach((w) => w.warehouseName && warehouseNames.add(w.warehouseName)));

  return (
    <AppLayout title={t("sklad")} subtitle={t("skladSubtitle")}>
      {error ? <div className="mb-5 rounded-[18px] bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label={t("productCount")} value={`${num(products.length)} ${t("productCount").toLowerCase()}`} />
        <Stat label={t("warehouseCount")} value={`${num(warehouseNames.size)} ${t("warehouseCount").toLowerCase()}`} />
        <Stat label={t("stockQty")} value={`${num(totalStock)} шт`} />
        <Stat label={t("skladValue")} value={money(totalSale, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4 max-xl:flex-col">
          <div>
            <h2 className="text-[26px] font-bold tracking-[-0.05em]">{t("productCatalog")}</h2>
            <p className="mt-1 max-w-[760px] text-[14px] leading-6 text-[var(--muted)]">{t("productCatalogSub")}</p>
          </div>
          <a href="/integrations" className="premium-button premium-button-soft shrink-0">{t("syncSettings")}</a>
        </div>

        <div className="mb-5 grid grid-cols-[1.5fr_220px_220px] gap-3 max-xl:grid-cols-1">
          <input className="premium-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t("search")}...`} />
          <select className="premium-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{t("filterCategory")}: {t("all")}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="premium-input" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}>
            <option value="all">{t("stockFilter")}: {t("all")}</option>
            <option value="in">{t("onlyInStock")}</option>
            <option value="zero">{t("zeroStock")}</option>
            <option value="negative">{t("negativeStock")}</option>
          </select>
        </div>

        <div className="table-wrap qanot-scroll">
          <table className="premium-table min-w-[1180px]">
            <thead>
              <tr>
                <th>{t("product")}</th>
                <th>{t("modelSku")}</th>
                <th>{t("category")}</th>
                <th>{t("barcode")}</th>
                <th className="cell-num">{t("quantity")}</th>
                <th className="cell-num">{t("reserve")}</th>
                <th className="cell-num">{t("inTransit")}</th>
                <th className="cell-num">{t("costPrice")}</th>
                <th className="cell-num">{t("salePrice")}</th>
                <th className="cell-num">{t("saleSum")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = Number(p.stock || 0);
                const costPrice = Number(p.costPrice || 0);
                const salePrice = Number(p.salePrice ?? p.price ?? 0);
                const reserve = Number(p.reserve || p.warehouses?.reduce((s, w) => s + Number(w.reserve || 0), 0) || 0);
                const inTransit = Number(p.inTransit || p.warehouses?.reduce((s, w) => s + Number(w.inTransit || 0), 0) || 0);
                const saleSum = Number(p.stockSaleValueUSD || p.stockValue || stock * salePrice || 0);
                const isOpen = openId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr onClick={() => setOpenId(isOpen ? "" : p.id)} className="cursor-pointer">
                      <td><div className="font-semibold">{p.name}</div></td>
                      <td className="muted">{p.sku || "—"}</td>
                      <td><span className="badge">{p.category || "—"}</span></td>
                      <td className="muted">{p.barcode || "—"}</td>
                      <td className="cell-num font-semibold">{num(stock)} шт</td>
                      <td className="cell-num muted">{num(reserve)}</td>
                      <td className="cell-num muted">{num(inTransit)}</td>
                      <td className="cell-num">{money(costPrice, "USD")}</td>
                      <td className="cell-num font-semibold">{money(salePrice, "USD")}</td>
                      <td className="cell-num font-semibold">{money(saleSum, "USD")}</td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td colSpan={10} className="bg-[var(--card-2)]">
                          <div className="grid gap-2">
                            {(p.warehouses || []).length ? (p.warehouses || []).map((w, idx) => (
                              <div key={`${p.id}-${idx}`} className="grid grid-cols-7 gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-3 text-[13px] max-xl:grid-cols-2">
                                <Mini label={t("warehouse")} value={w.warehouseName || "—"} />
                                <Mini label={t("quantity")} value={`${num(w.quantity || 0)} шт`} />
                                <Mini label={t("reserve")} value={num(w.reserve || 0)} />
                                <Mini label={t("inTransit")} value={num(w.inTransit || 0)} />
                                <Mini label={t("costPrice")} value={money(w.costPrice || costPrice, "USD")} />
                                <Mini label={t("salePrice")} value={money(w.salePrice || salePrice, "USD")} />
                                <Mini label={t("saleSum")} value={money(w.saleValue || w.value || 0, "USD")} />
                              </div>
                            )) : <p className="text-[13px] text-[var(--muted)]">{t("noWarehouses")}</p>}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!filtered.length ? <tr><td colSpan={10} className="p-10 text-center text-[var(--muted)]">{t("noProducts")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-5"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="value mt-4 text-[28px] font-bold text-[var(--text)]">{value}</p></div>;
}
function Mini({ label, value }: { label: string; value: any }) {
  return <div><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p><p className="mt-1 font-semibold text-[var(--text)]">{value}</p></div>;
}
