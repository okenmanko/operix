"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import QrLabel from "../components/QrLabel";
import { apiJson } from "../lib/api";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  brand?: string | null;
  model?: string | null;
};

type Warehouse = {
  id: string;
  name: string;
};

type Label = {
  id: string;
  qrCode: string;
  serialNumber?: string | null;
  status: string;
  salePrice?: number | null;
  currency?: string;
  productName: string;
  productSku?: string | null;
  productBrand?: string | null;
  productModel?: string | null;
  warehouseName: string;
};

const statuses = [
  { value: "", label: "Hammasi" },
  { value: "IN_STOCK", label: "Skladda" },
  { value: "RESERVED", label: "Rezerv" },
  { value: "RETURNED", label: "Qaytgan" },
  { value: "SOLD", label: "Sotilgan" },
];

export default function QrLabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [status, setStatus] = useState("IN_STOCK");
  const [limit, setLimit] = useState("120");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadBase() {
    const [p, w] = await Promise.all([
      apiJson<Product[]>("/inventory/products"),
      apiJson<Warehouse[]>("/inventory/warehouses"),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setWarehouses(Array.isArray(w) ? w : []);
  }

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (status) params.set("status", status);
    if (limit) params.set("limit", limit);
    return params.toString();
  }, [productId, warehouseId, status, limit]);

  async function loadLabels() {
    setError("");
    setLoading(true);
    try {
      const data = await apiJson<Label[]>(`/qr/labels${query ? `?${query}` : ""}`);
      setLabels(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "QR label yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase().catch(() => {});
  }, []);

  useEffect(() => {
    loadLabels().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function reissue(id: string) {
    const reason = window.prompt("QR qayta chiqarish sababi:", "Label yo‘qolgan");
    if (reason === null) return;
    await apiJson(`/qr/reissue/${id}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await loadLabels();
  }

  return (
    <AppLayout title="QR Label Print" subtitle="Har bir dona tovar uchun individual QR label chiqarish">
      <div className="print:hidden">
        <div className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="">Barcha mahsulotlar</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="">Barcha skladlar</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Limit"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <button
              onClick={() => window.print()}
              className="h-12 rounded-2xl bg-slate-950 px-6 text-[14px] font-extrabold text-white transition hover:bg-slate-800"
            >
              Print A4
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-[13px] font-semibold text-slate-500">
            <span>{loading ? "Yuklanmoqda..." : `${labels.length} ta label tayyor`}</span>
            {error ? <span className="text-red-500">{error}</span> : <span>QR offline generatsiya qilinadi, internet kerak emas</span>}
          </div>
        </div>
      </div>

      {!labels.length && !loading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center print:hidden">
          <div className="text-[18px] font-extrabold text-slate-950">QR label topilmadi</div>
          <p className="mt-2 text-[14px] font-medium text-slate-500">
            Avval Inventory sahifasida mahsulot kirim qiling. Kirim qilinganda har bir dona uchun QR yaratiladi.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 print:grid-cols-4 print:gap-2">
        {labels.map((item) => (
          <div key={item.id} className="group relative">
            <QrLabel
              qrCode={item.qrCode}
              productName={item.productName}
              warehouseName={item.warehouseName}
              status={item.status}
              serialNumber={item.serialNumber}
              price={item.salePrice}
              currency={item.currency || "UZS"}
            />

            {item.status !== "SOLD" ? (
              <button
                onClick={() => reissue(item.id)}
                className="absolute right-2 top-2 hidden rounded-xl bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-950 shadow-lg ring-1 ring-slate-200 group-hover:block print:hidden"
              >
                Re-QR
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
