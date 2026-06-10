"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Product = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  inStockQty: number;
  soldQty: number;
  reservedQty: number;
};

type Warehouse = { id: string; name: string };

type Summary = {
  products: number;
  warehouses: number;
  inStock: number;
  sold: number;
  reserved: number;
};

export default function InventoryPage() {
  const { t } = useI18n();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function load() {
    const [s, p, w] = await Promise.all([
      apiJson<Summary>("/inventory/summary"),
      apiJson<Product[]>("/inventory/products"),
      apiJson<Warehouse[]>("/inventory/warehouses"),
    ]);

    setSummary(s);
    setProducts(Array.isArray(p) ? p : []);
    setWarehouses(Array.isArray(w) ? w : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function createProduct() {
    if (!name.trim()) return;

    await apiJson("/inventory/products", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        salePrice: Number(salePrice || 0),
        currency: "UZS",
      }),
    });

    setName("");
    setBrand("");
    setModel("");
    setSalePrice("");
    await load();
  }

  async function receiveStock() {
    if (!productId || !warehouseId) return;

    await apiJson("/inventory/receive", {
      method: "POST",
      body: JSON.stringify({
        productId,
        warehouseId,
        quantity: Number(quantity || 1),
      }),
    });

    setQuantity("1");
    await load();
  }

  const stats = [
    { label: "Mahsulotlar", value: summary?.products || 0 },
    { label: "Skladlar", value: summary?.warehouses || 0 },
    { label: "Qoldiq", value: summary?.inStock || 0 },
    { label: "Sotilgan", value: summary?.sold || 0 },
  ];

  return (
    <AppLayout
      title="Sklad"
      subtitle="QR Inventory, mahsulotlar va sklad qoldiqlari"
    >
      <div className="grid grid-cols-4 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <p className="text-[13px] font-semibold text-slate-500">
              {item.label}
            </p>
            <p className="mt-8 text-[34px] font-semibold tracking-[-0.06em] text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[430px_1fr] gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
            Mahsulot qo‘shish
          </h2>

          <div className="mt-5 space-y-3">
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mahsulot nomi"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand"
              />

              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model"
              />
            </div>

            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Sotuv narxi"
            />

            <button
              onClick={createProduct}
              className="h-12 w-full rounded-2xl bg-sky-500 text-[14px] font-bold text-white transition hover:bg-sky-600"
            >
              Saqlash
            </button>
          </div>

          <div className="my-7 h-px bg-slate-200" />

          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
            Kirim qilish
          </h2>

          <div className="mt-5 space-y-3">
            <select
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Mahsulot tanlang</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">Sklad tanlang</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Miqdor"
            />

            <button
              onClick={receiveStock}
              className="h-12 w-full rounded-2xl bg-slate-950 text-[14px] font-bold text-white transition hover:bg-slate-800"
            >
              QR bilan kirim qilish
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
              Sklad
            </h2>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-[12px] font-bold text-sky-600">
              {products.length} mahsulot
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1fr_120px_120px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
              <div>Mahsulot</div>
              <div className="text-right">Qoldiq</div>
              <div className="text-right">Sotilgan</div>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center text-[14px] font-semibold text-slate-400">
                Ma’lumot yo‘q
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_120px_120px] items-center border-t border-slate-100 px-4 py-4"
                >
                  <div>
                    <p className="text-[14px] font-bold text-slate-950">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-slate-400">
                      {[p.brand, p.model].filter(Boolean).join(" • ") || "-"}
                    </p>
                  </div>

                  <div className="text-right text-[14px] font-bold text-slate-950">
                    {p.inStockQty}
                  </div>

                  <div className="text-right text-[14px] font-bold text-slate-500">
                    {p.soldQty}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}