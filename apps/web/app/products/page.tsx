"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import QrLabel from "../components/QrLabel";
import { apiJson } from "../lib/api";

type Product = { id: string; name: string };
type QrItem = {
  id: string;
  qrCode: string;
  productName: string;
  warehouseName: string;
  status: string;
  serialNumber?: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [items, setItems] = useState<QrItem[]>([]);

  async function loadProducts() {
    const data = await apiJson<Product[]>("/inventory/products");
    setProducts(Array.isArray(data) ? data : []);
  }

  async function loadQr(id: string) {
    setProductId(id);
    if (!id) {
      setItems([]);
      return;
    }

    const data = await apiJson<QrItem[]>(`/inventory/qr-print/${id}`);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadProducts().catch(() => {});
  }, []);

  return (
    <AppLayout title="QR kodlar" subtitle="Har bir dona tovar uchun individual QR">
      <div className="mb-5 flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <select
          value={productId}
          onChange={(e) => loadQr(e.target.value)}
          className="h-12 w-[420px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          <option value="">Mahsulot tanlang</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button onClick={() => window.print()} className="h-12 rounded-2xl bg-slate-950 px-6 text-[14px] font-bold text-white transition hover:bg-slate-800">
          Print QR
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 print:grid-cols-3">
        {items.map((item) => (
          <QrLabel
            key={item.id}
            qrCode={item.qrCode}
            productName={item.productName}
            warehouseName={item.warehouseName}
            status={item.status}
          />
        ))}
      </div>
    </AppLayout>
  );
}
