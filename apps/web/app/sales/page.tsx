"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type ScanItem = {
  id: string;
  qrCode: string;
  serialNumber?: string | null;
  productName: string;
  warehouseName?: string | null;
  salePrice: number;
  currency: string;
};

type Sale = {
  id: string;
  saleNumber: string;
  totalAmount: number;
  currency: string;
  method: string;
  createdAt: string;
  items?: any[];
};

function money(value: number, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function SalesPage() {
  const [code, setCode] = useState("");
  const [cart, setCart] = useState<ScanItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [method, setMethod] = useState("CASH");
  const [currency, setCurrency] = useState("UZS");
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const total = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + Number(item.salePrice || 0), 0);
    return Math.max(sum - Number(discount || 0), 0);
  }, [cart, discount]);

  async function loadSales() {
    try {
      const data = await apiJson<{ sales: Sale[] }>(`/sales?currency=${currency}`);
      setSales(data.sales || []);
    } catch (e: any) {
      setError(e?.message || "Sotuvlar yuklanmadi");
    }
  }

  useEffect(() => {
    loadSales();
  }, [currency]);

  async function scan() {
    setError("");
    setSuccess("");
    const clean = code.trim();
    if (!clean) return;
    if (cart.some((item) => item.qrCode === clean || item.id === clean)) {
      setError("Bu tovar savatda bor");
      return;
    }

    try {
      setLoading(true);
      const item = await apiJson<ScanItem>("/sales/scan", {
        method: "POST",
        body: JSON.stringify({ code: clean }),
      });
      setCart((prev) => [...prev, item]);
      setCurrency(item.currency || currency);
      setCode("");
    } catch (e: any) {
      setError(e?.message || "QR topilmadi");
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    setError("");
    setSuccess("");
    if (!cart.length) {
      setError("Savat bo‘sh");
      return;
    }

    try {
      setLoading(true);
      const sale = await apiJson<Sale>("/sales/checkout", {
        method: "POST",
        body: JSON.stringify({
          method,
          currency,
          discount: Number(discount || 0),
          customerName: customerName.trim() || undefined,
          items: cart.map((item) => ({ stockItemId: item.id, qrCode: item.qrCode, price: item.salePrice })),
        }),
      });
      setSuccess(`Sotuv saqlandi: ${sale.saleNumber}`);
      setCart([]);
      setDiscount("0");
      setCustomerName("");
      await loadSales();
    } catch (e: any) {
      setError(e?.message || "Sotuv amalga oshmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold tracking-[-0.04em] text-slate-950">Sotuv POS</h1>
            <p className="mt-2 text-[15px] font-semibold text-slate-500">QR skan → savat → sotuv → sklad minus → DDS income</p>
          </div>
          <button onClick={loadSales} className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white">Yangilash</button>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{success}</div>}

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">QR skan</h2>
            <div className="mt-5 flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                autoFocus
                placeholder="QR kod yoki serial kiriting"
                className="h-14 flex-1 rounded-2xl border border-slate-200 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button disabled={loading} onClick={scan} className="rounded-2xl bg-blue-600 px-7 text-sm font-bold text-white disabled:opacity-60">Qo‘shish</button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <tr><th className="p-4">Tovar</th><th>QR</th><th>Sklad</th><th>Narx</th><th></th></tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} className="p-5 text-slate-400">Savat bo‘sh</td></tr>
                  ) : cart.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-4 font-bold text-slate-900">{item.productName}</td>
                      <td className="text-slate-500">{item.qrCode}</td>
                      <td className="text-slate-500">{item.warehouseName || "-"}</td>
                      <td className="font-bold">{money(item.salePrice, item.currency)}</td>
                      <td><button onClick={() => setCart((prev) => prev.filter((x) => x.id !== item.id))} className="text-red-500">O‘chirish</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Checkout</h2>
            <div className="mt-5 grid gap-3">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-13 rounded-2xl border border-slate-200 px-4"><option>UZS</option><option>USD</option></select>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-13 rounded-2xl border border-slate-200 px-4"><option value="CASH">Naqd</option><option value="CARD">Karta</option><option value="CLICK">Click</option><option value="PAYME">Payme</option><option value="TRANSFER">Bank</option></select>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Mijoz nomi ixtiyoriy" className="h-13 rounded-2xl border border-slate-200 px-4" />
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Chegirma" type="number" className="h-13 rounded-2xl border border-slate-200 px-4" />
            </div>
            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-400">Jami</p>
              <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-slate-950">{money(total, currency)}</p>
            </div>
            <button disabled={loading || !cart.length} onClick={checkout} className="mt-5 h-14 w-full rounded-2xl bg-slate-950 text-sm font-bold text-white disabled:opacity-50">Sotuvni yakunlash</button>
          </section>
        </div>

        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Oxirgi sotuvlar</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="p-4">Chek</th><th>Sana</th><th>Method</th><th>Summa</th></tr></thead>
              <tbody>
                {sales.length === 0 ? <tr><td colSpan={4} className="p-5 text-slate-400">Sotuv yo‘q</td></tr> : sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-slate-100"><td className="p-4 font-bold">{sale.saleNumber}</td><td>{new Date(sale.createdAt).toLocaleString()}</td><td>{sale.method}</td><td className="font-bold">{money(sale.totalAmount, sale.currency)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
