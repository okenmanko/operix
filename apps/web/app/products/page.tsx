"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  salePrice?: number | null;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  stockValue?: number | null;
  warehouses?: Array<{
    warehouseName: string;
    quantity: number;
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
    const q = query.toLowerCase();
    return products.filter((product) =>
      product.name?.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q) ||
      product.barcode?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q),
    );
  }, [products, query]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const totalValue = products.reduce((sum, product) => sum + Number(product.stockValue || 0), 0);

  return (
    <AppLayout title="Products" subtitle="Mahsulotlar, narxlar, qoldiq va skladlar bo‘yicha taqsimot.">
      {error ? (
        <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
      ) : null}

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat label="Mahsulot turi" value={`${num(products.length)} ta`} />
        <Stat label="Jami qoldiq" value={`${num(totalStock)} dona`} />
        <Stat label="Jami summa" value={money(totalValue, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-normal tracking-[-0.04em]">Mahsulotlar</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">Qator ustiga bosing — qaysi skladda nechta borligi ochiladi.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Qidirish..."
              className="h-11 w-[280px] rounded-[15px] border border-[#dfe8f3] bg-white px-4 text-[13px] outline-none"
            />
            <a
              href="/integrations"
              className="inline-flex h-11 items-center justify-center rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white shadow-[0_12px_26px_rgba(49,94,251,0.22)]"
            >
              MoySklad sync
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Nomi</th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">Barcode</th>
                <th className="p-4 font-normal">Category</th>
                <th className="p-4 font-normal">Qoldiq</th>
                <th className="p-4 font-normal">Narx</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((product) => {
                const stock = Number(product.stock || 0);
                const price = Number(product.salePrice ?? product.price ?? 0);
                const isOpen = openId === product.id;

                return (
                  <>
                    <tr
                      key={product.id}
                      onClick={() => setOpenId(isOpen ? "" : product.id)}
                      className="cursor-pointer border-t border-[#edf2f7] transition hover:bg-[#f8fafc]"
                    >
                      <td className="p-4 text-[#111827]">{product.name}</td>
                      <td className="p-4 text-[#64748b]">{product.sku || "—"}</td>
                      <td className="p-4 text-[#64748b]">{product.barcode || "—"}</td>
                      <td className="p-4 text-[#64748b]">{product.category || "—"}</td>
                      <td className="p-4 text-[#111827]">{num(stock)} dona</td>
                      <td className="p-4 text-[#111827]">{money(price, "USD")}</td>
                    </tr>

                    {isOpen ? (
                      <tr className="border-t border-[#edf2f7] bg-[#fbfdff]">
                        <td colSpan={6} className="p-4">
                          <div className="rounded-[18px] border border-[#e7edf5] bg-white p-4">
                            <p className="mb-3 text-[13px] font-medium text-[#111827]">Skladlar bo‘yicha qoldiq</p>
                            {!product.warehouses?.length ? (
                              <p className="text-[13px] text-[#8aa0ba]">Bu mahsulot bo‘yicha sklad qoldiq topilmadi. Integratsiyalar → Sync all ni qayta bosing.</p>
                            ) : (
                              <div className="grid grid-cols-3 gap-3">
                                {product.warehouses.map((item) => (
                                  <div key={`${product.id}-${item.warehouseName}`} className="rounded-[16px] bg-[#f8fafc] px-4 py-3">
                                    <p className="text-[13px] text-[#64748b]">{item.warehouseName}</p>
                                    <p className="mt-2 text-[20px] tracking-[-0.04em] text-[#111827]">{num(item.quantity)} dona</p>
                                    <p className="mt-1 text-[12px] text-[#8aa0ba]">{money(item.value, "USD")}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#8aa0ba]">
                    Mahsulot yo‘q. Integratsiyalar sahifasidan MoySklad sync qiling.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] text-[#64748b]">{label}</p>
      <p className="mt-4 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p>
    </div>
  );
}
