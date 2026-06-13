"use client";

import { useEffect, useState } from "react";
import { Package, Warehouse } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";
import CustomSelect from "../components/ui/CustomSelect";
import { Field, PremiumInput } from "../components/ui/Field";
import { Toast } from "../components/ui/Toast";

type Product = { id: string; name: string; sku?: string | null; brand?: string | null; inStockQty?: number; soldQty?: number };
type WarehouseItem = { id: string; name: string };
type Summary = { products: number; warehouses: number; inStock: number; sold: number; reserved: number };

const emptySummary: Summary = { products: 0, warehouses: 0, inStock: 0, sold: 0, reserved: 0 };

export default function InventoryPage() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function load() {
    try {
      setError("");
      const [summaryData, productsData, warehousesData] = await Promise.all([
        apiJson<Summary>("/inventory/summary"),
        apiJson<Product[]>("/inventory/products"),
        apiJson<WarehouseItem[]>("/inventory/warehouses"),
      ]);
      setSummary({ ...emptySummary, ...(summaryData || {}) });
      setProducts(Array.isArray(productsData) ? productsData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      if (!productId && productsData?.[0]?.id) setProductId(productsData[0].id);
      if (!warehouseId && warehousesData?.[0]?.id) setWarehouseId(warehousesData[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Inventory yuklanmadi");
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function createProduct() {
    try {
      await apiJson("/inventory/products", {
        method: "POST",
        body: JSON.stringify({ name, sku, brand, salePrice: Number(salePrice || 0), currency: "UZS" }),
      });
      setName(""); setSku(""); setBrand(""); setSalePrice("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mahsulot yaratilmadi");
    }
  }

  async function receive() {
    try {
      await apiJson("/inventory/receive", {
        method: "POST",
        body: JSON.stringify({ productId, warehouseId, quantity: Number(quantity || 1) }),
      });
      setQuantity("1");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kirim qilinmadi");
    }
  }

  const productOptions = products.map((p) => ({ value: p.id, label: p.name, icon: <Package size={18} /> }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: w.name, icon: <Warehouse size={18} /> }));

  return (
    <AppLayout title="Inventory" subtitle="Mahsulotlar, omborlar va QR kirim oqimi.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="mb-5 grid grid-cols-5 gap-4">
        <Stat label="Products" value={summary.products} />
        <Stat label="Warehouses" value={summary.warehouses} />
        <Stat label="In stock" value={summary.inStock} />
        <Stat label="Sold" value={summary.sold} />
        <Stat label="Reserved" value={summary.reserved} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="premium-card p-6">
          <h2 className="text-[22px] font-normal tracking-[-0.04em]">Mahsulot qo‘shish</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label="Nomi"><PremiumInput value={name} onChange={setName} /></Field>
            <Field label="SKU"><PremiumInput value={sku} onChange={setSku} /></Field>
            <Field label="Brand"><PremiumInput value={brand} onChange={setBrand} /></Field>
            <Field label="Sotuv narxi"><PremiumInput value={salePrice} onChange={setSalePrice} /></Field>
          </div>
          <button onClick={createProduct} className="premium-button premium-button-primary mt-5">Saqlash</button>
        </div>

        <div className="premium-card p-6">
          <h2 className="text-[22px] font-normal tracking-[-0.04em]">Kirim / QR yaratish</h2>
          <div className="mt-5 space-y-4">
            <Field label="Mahsulot"><CustomSelect value={productId} onChange={setProductId} options={productOptions} /></Field>
            <Field label="Ombor"><CustomSelect value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} /></Field>
            <Field label="Miqdor"><PremiumInput value={quantity} onChange={setQuantity} /></Field>
          </div>
          <button onClick={receive} className="premium-button premium-button-primary mt-5">Kirim qilish</button>
        </div>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Mahsulotlar</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
              <tr><th className="p-4 font-normal">Nomi</th><th className="p-4 font-normal">SKU</th><th className="p-4 font-normal">Brand</th><th className="p-4 font-normal">In stock</th><th className="p-4 font-normal">Sold</th></tr>
            </thead>
            <tbody>
              {products.map((p) => <tr key={p.id} className="border-t border-[#edf2f7]"><td className="p-4">{p.name}</td><td className="p-4 text-[#64748b]">{p.sku || "—"}</td><td className="p-4 text-[#64748b]">{p.brand || "—"}</td><td className="p-4">{p.inStockQty || 0}</td><td className="p-4">{p.soldQty || 0}</td></tr>)}
              {!products.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Mahsulot yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="premium-card p-5"><p className="text-[12px] uppercase tracking-[0.12em] text-[#8aa0ba]">{label}</p><p className="mt-3 text-[28px] tracking-[-0.04em]">{value}</p></div>;
}
