"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  salePrice?: number | null;
  currency?: string | null;
};

function money(value: number | null | undefined, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiJson<Product[]>("/inventory/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mahsulotlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Products" subtitle="Mahsulotlar katalogi va narxlari.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="premium-card p-6">
        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Nomi</th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">Brand</th>
                <th className="p-4 font-normal">Category</th>
                <th className="p-4 font-normal">Narx</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">{item.name}</td>
                  <td className="p-4 text-[#64748b]">{item.sku || "—"}</td>
                  <td className="p-4 text-[#64748b]">{item.brand || "—"}</td>
                  <td className="p-4 text-[#64748b]">{item.category || "—"}</td>
                  <td className="p-4">{money(item.salePrice, item.currency || "UZS")}</td>
                </tr>
              ))}
              {!products.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Mahsulot yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
