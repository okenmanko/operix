"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Wallet, Banknote } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, dateText } from "../lib/api";
import CustomSelect from "../components/ui/CustomSelect";
import { Field, PremiumInput } from "../components/ui/Field";
import { Toast } from "../components/ui/Toast";

type ScanItem = { id: string; qrCode: string; productName: string; warehouseName?: string | null; salePrice: number; currency: string };
type Sale = { id: string; saleNumber?: string | null; totalAmount: number; currency: string; method?: string | null; createdAt: string };

const methodOptions = [
  { value: "CASH", label: "Naqd", icon: <Banknote size={18} /> },
  { value: "CARD", label: "Karta", icon: <CreditCard size={18} /> },
  { value: "TRANSFER", label: "Transfer", icon: <Wallet size={18} /> },
];

const currencyOptions = [
  { value: "UZS", label: "UZS" },
  { value: "USD", label: "USD" },
];

export default function SalesPage() {
  const [code, setCode] = useState("");
  const [cart, setCart] = useState<ScanItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [method, setMethod] = useState("CASH");
  const [currency, setCurrency] = useState("UZS");
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.salePrice || 0), 0), [cart]);
  const total = Math.max(subtotal - Number(discount || 0), 0);

  async function loadSales() {
    try {
      const data = await apiJson<Sale[]>(`/sales?currency=${currency}`);
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setSales([]);
    }
  }

  useEffect(() => { loadSales(); /* eslint-disable-next-line */ }, [currency]);

  async function scan() {
    const clean = code.trim();
    if (!clean) return;
    try {
      setError("");
      const item = await apiJson<ScanItem>("/sales/scan", { method: "POST", body: JSON.stringify({ code: clean }) });
      if (cart.some((x) => x.id === item.id)) return setError("Bu QR allaqachon savatchada bor");
      setCart((current) => [...current, item]);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "QR topilmadi");
    }
  }

  async function checkout() {
    if (!cart.length) return setError("Savatcha bo‘sh");
    try {
      setError("");
      await apiJson("/sales/checkout", {
        method: "POST",
        body: JSON.stringify({
          method,
          currency,
          discount: Number(discount || 0),
          customerName,
          customerPhone,
          items: cart.map((item) => ({ stockItemId: item.id })),
        }),
      });
      setCart([]);
      setDiscount("0");
      setCustomerName("");
      setCustomerPhone("");
      await loadSales();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sotuv yakunlanmadi");
    }
  }

  return (
    <AppLayout title="Sales / POS" subtitle="QR orqali tez sotuv, checkout va oxirgi savdolar.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="grid grid-cols-[1.3fr_0.7fr] gap-5">
        <div className="premium-card p-6">
          <h2 className="text-[22px] font-normal tracking-[-0.04em]">Sotuv savatchasi</h2>
          <div className="mt-5 flex gap-3">
            <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") scan(); }} placeholder="QR kod / serial" className="premium-input" />
            <button type="button" onClick={scan} className="premium-button premium-button-primary">Qo‘shish</button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
                <tr><th className="p-4 font-normal">Mahsulot</th><th className="p-4 font-normal">QR</th><th className="p-4 font-normal">Ombor</th><th className="p-4 font-normal">Narx</th><th className="p-4 text-right font-normal">Amal</th></tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-t border-[#edf2f7]">
                    <td className="p-4">{item.productName}</td><td className="p-4 text-[#64748b]">{item.qrCode}</td><td className="p-4 text-[#64748b]">{item.warehouseName || "—"}</td><td className="p-4">{money(item.salePrice, item.currency || currency)}</td>
                    <td className="p-4 text-right"><button onClick={() => setCart((current) => current.filter((x) => x.id !== item.id))} className="rounded-[14px] bg-[#f5f7fa] px-4 py-2 text-[13px] text-[#64748b]">O‘chirish</button></td>
                  </tr>
                ))}
                {!cart.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Savatcha bo‘sh</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card p-6">
          <h2 className="text-[22px] font-normal tracking-[-0.04em]">Checkout</h2>
          <div className="mt-5 space-y-4">
            <Field label="Valyuta"><CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} /></Field>
            <Field label="To‘lov turi"><CustomSelect value={method} onChange={setMethod} options={methodOptions} /></Field>
            <Field label="Chegirma"><PremiumInput value={discount} onChange={setDiscount} /></Field>
            <Field label="Mijoz"><PremiumInput value={customerName} onChange={setCustomerName} /></Field>
            <Field label="Telefon"><PremiumInput value={customerPhone} onChange={setCustomerPhone} /></Field>
          </div>

          <div className="mt-6 rounded-[22px] bg-[#f8fafc] p-5">
            <div className="flex justify-between text-[14px] text-[#64748b]"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
            <div className="mt-3 flex justify-between text-[22px] font-normal text-[#111827]"><span>Total</span><span>{money(total, currency)}</span></div>
          </div>
          <button onClick={checkout} className="premium-button premium-button-primary mt-5 w-full">Sotuvni yakunlash</button>
        </div>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Oxirgi sotuvlar</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <tbody>
              {sales.map((sale) => <tr key={sale.id} className="border-t border-[#edf2f7]"><td className="p-4">{sale.saleNumber || sale.id.slice(0, 8)}</td><td className="p-4 text-[#64748b]">{dateText(sale.createdAt)}</td><td className="p-4 text-[#64748b]">{sale.method || "—"}</td><td className="p-4">{money(sale.totalAmount, sale.currency)}</td></tr>)}
              {!sales.length ? <tr><td colSpan={4} className="p-8 text-center text-[#8aa0ba]">Sotuvlar yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
