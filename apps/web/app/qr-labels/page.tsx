"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Package, QrCode, Warehouse } from "lucide-react";
import AppLayout from "../components/AppLayout";
import QrLabel from "../components/QrLabel";
import { apiJson } from "../lib/api";
import CustomSelect from "../components/ui/CustomSelect";
import { Toast } from "../components/ui/Toast";

type Product = { id: string; name: string };
type WarehouseItem = { id: string; name: string };

type Label = {
  id: string;
  qrCode: string;
  status: string;
  salePrice?: number | null;
  currency?: string;
  productName: string;
  warehouseName: string;
};

const statusOptions = [
  { value: "", label: "Hammasi", icon: <Layers size={18} /> },
  { value: "IN_STOCK", label: "Skladda", icon: <Package size={18} /> },
  { value: "RESERVED", label: "Rezerv", icon: <QrCode size={18} /> },
  { value: "RETURNED", label: "Qaytgan", icon: <QrCode size={18} /> },
  { value: "SOLD", label: "Sotilgan", icon: <QrCode size={18} /> },
];

function money(value: number | null | undefined, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function QrLabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const productOptions = useMemo(
    () => [
      { value: "", label: "Hammasi", icon: <Layers size={18} /> },
      ...products.map((item) => ({ value: item.id, label: item.name, icon: <Package size={18} /> })),
    ],
    [products],
  );

  const warehouseOptions = useMemo(
    () => [
      { value: "", label: "Hammasi", icon: <Layers size={18} /> },
      ...warehouses.map((item) => ({ value: item.id, label: item.name, icon: <Warehouse size={18} /> })),
    ],
    [warehouses],
  );

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (status) params.set("status", status);
    return params.toString();
  }, [productId, warehouseId, status]);

  async function loadMeta() {
    try {
      const [productsData, warehousesData] = await Promise.all([
        apiJson<Product[]>("/inventory/products"),
        apiJson<WarehouseItem[]>("/inventory/warehouses"),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
    } catch {
      setProducts([]);
      setWarehouses([]);
    }
  }

  async function loadLabels() {
    try {
      setError("");
      const data = await apiJson<Label[]>(`/qr/labels${query ? `?${query}` : ""}`);
      setLabels(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "QR label yuklanmadi");
      setLabels([]);
    }
  }

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadLabels(); /* eslint-disable-next-line */ }, [query]);

  async function reissue(id: string) {
    try {
      await apiJson(`/qr/reissue/${id}`, { method: "POST", body: JSON.stringify({ reason: "Reissued from Operix web" }) });
      await loadLabels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "QR qayta chiqarilmadi");
    }
  }

  return (
    <AppLayout title="QR Labels" subtitle="Mahsulot QR etiketkalari, print va qayta chiqarish.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="no-print premium-card mb-5 p-6">
        <div className="grid grid-cols-4 gap-4">
          <CustomSelect value={productId} onChange={setProductId} options={productOptions} />
          <CustomSelect value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} />
          <CustomSelect value={status} onChange={setStatus} options={statusOptions} />
          <div className="flex items-center gap-3">
            <button onClick={loadLabels} className="premium-button premium-button-primary">Yangilash</button>
            <button onClick={() => window.print()} className="premium-button premium-button-soft">Print</button>
          </div>
        </div>
      </div>

      {labels.length ? (
        <div className="grid grid-cols-4 gap-5">
          {labels.map((item) => (
            <div key={item.id} className="space-y-3">
              <QrLabel value={item.qrCode} title={item.productName} subtitle={`${item.warehouseName} • ${money(item.salePrice, item.currency || "UZS")}`} />
              <button onClick={() => reissue(item.id)} className="no-print w-full rounded-[16px] bg-[#f5f7fa] px-4 py-3 text-[13px] text-[#64748b] hover:bg-[#eef4ff] hover:text-[#315efb]">
                Reissue QR
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card flex min-h-[330px] flex-col items-center justify-center p-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#e7edf5] bg-[#f8fafc] text-[#8aa0ba]">
            <QrCode size={34} strokeWidth={1.6} />
          </div>
          <p className="mt-5 text-[22px] font-normal tracking-[-0.03em] text-[#7d8ca2]">QR label topilmadi</p>
          <p className="mt-2 max-w-md text-[14px] font-normal leading-6 text-[#9aa9bd]">Filterlarni o‘zgartiring yoki inventory ichida mahsulot kirim qiling.</p>
        </div>
      )}
    </AppLayout>
  );
}
