"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "../../components/AppLayout";
import QrLabel from "../../components/QrLabel";
import { apiJson } from "../../lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    apiJson(`/inventory/products/${id}`).then(setProduct).catch(() => {});
  }, [id]);

  if (!product) {
    return (
      <AppLayout title="Mahsulot" subtitle="Yuklanmoqda...">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">Yuklanmoqda...</div>
      </AppLayout>
    );
  }

  const stats = [
    ["Jami", product.totalQty || 0],
    ["Qoldiq", product.inStockQty || 0],
    ["Sotilgan", product.soldQty || 0],
    ["Rezerv", product.reservedQty || 0],
  ];

  return (
    <AppLayout title={product.name} subtitle={[product.brand, product.model, product.category].filter(Boolean).join(" • ") || "Product detail"}>
      <div className="grid grid-cols-4 gap-4">
        {stats.map(([label, value]) => (
          <div key={String(label)} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-[13px] font-semibold text-slate-500">{label}</p>
            <p className="mt-8 text-[34px] font-semibold tracking-[-0.06em] text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_420px] gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">QR dona tovarlar</h2>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {product.stockItems?.map((item: any) => (
              <QrLabel key={item.id} qrCode={item.qrCode} productName={product.name} warehouseName={item.warehouse?.name} status={item.status} />
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Ma’lumot</h2>
          <div className="mt-5 space-y-3 text-[14px] font-semibold">
            <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-400">SKU</span><span>{product.sku || "-"}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-400">Barcode</span><span>{product.barcode || "-"}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-400">Narx</span><span>{Number(product.salePrice || 0).toLocaleString("ru-RU")} {product.currency}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-400">Tannarx</span><span>{Number(product.costPrice || 0).toLocaleString("ru-RU")} {product.currency}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Status</span><span>{product.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
          </div>
          <button onClick={() => window.print()} className="mt-6 h-12 w-full rounded-2xl bg-slate-950 text-[14px] font-bold text-white transition hover:bg-slate-800">QR larni print qilish</button>
        </div>
      </div>
    </AppLayout>
  );
}
