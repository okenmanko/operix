"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, PackageSearch, Trash2, Wallet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, dateText, money, num } from "../lib/api";
import CustomSelect from "../components/ui/CustomSelect";
import { Field, PremiumInput } from "../components/ui/Field";
import { Toast } from "../components/ui/Toast";

type ProductSuggestion = {
  id: string;
  productId: string;
  name: string;
  productName?: string;
  sku?: string | null;
  model?: string | null;
  barcode?: string | null;
  category?: string | null;
  warehouseName?: string | null;
  stockItemId?: string | null;
  stock?: number | null;
  salePrice: number;
  costPrice?: number | null;
  currency: string;
};

type CartItem = ProductSuggestion & {
  cartId: string;
  quantity: number;
};

type Sale = {
  id: string;
  saleNumber?: string | null;
  totalAmount: number;
  currency: string;
  method?: string | null;
  createdAt: string;
};

const methodOptions = [
  { value: "CASH", label: "Naqd", icon: <Banknote size={18} /> },
  { value: "CARD", label: "Karta", icon: <CreditCard size={18} /> },
  { value: "TRANSFER", label: "Transfer", icon: <Wallet size={18} /> },
];

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "UZS", label: "UZS" },
];

function cleanText(value: unknown) {
  return String(value || "").trim();
}

export default function SalesPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [method, setMethod] = useState("CASH");
  const [currency, setCurrency] = useState("USD");
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.salePrice || 0) * Number(item.quantity || 1), 0),
    [cart],
  );
  const total = Math.max(subtotal - Number(discount || 0), 0);

  async function loadSales() {
    try {
      const data = await apiJson<any>(`/sales?currency=${currency}`);
      const rows = Array.isArray(data) ? data : Array.isArray(data?.sales) ? data.sales : [];
      setSales(rows);
    } catch {
      setSales([]);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  useEffect(() => {
    const clean = query.trim();
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!clean) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const data = await apiJson<ProductSuggestion[]>(`/sales/search?q=${encodeURIComponent(clean)}`);
        setSuggestions(Array.isArray(data) ? data : []);
        setSelectedIndex(0);
        setSuggestOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 180);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  function addProduct(product: ProductSuggestion) {
    setError("");
    setCart((current) => {
      const key = product.stockItemId || product.productId || product.id;
      const exists = current.find((item) => (item.stockItemId || item.productId || item.id) === key);

      if (exists) {
        return current.map((item) =>
          (item.stockItemId || item.productId || item.id) === key
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          ...product,
          productId: product.productId || product.id,
          cartId: `${key}-${Date.now()}`,
          quantity: 1,
          currency: product.currency || currency,
          salePrice: Number(product.salePrice || 0),
        },
      ];
    });
    setQuery("");
    setSuggestions([]);
    setSuggestOpen(false);
  }

  async function scanOrAddFirst() {
    const clean = query.trim();
    if (!clean) return;

    if (suggestions.length) {
      addProduct(suggestions[selectedIndex] || suggestions[0]);
      return;
    }

    try {
      setError("");
      const item = await apiJson<ProductSuggestion>("/sales/scan", {
        method: "POST",
        body: JSON.stringify({ code: clean }),
      });
      addProduct(item);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mahsulot topilmadi");
    }
  }

  function changeQty(cartId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) => (item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0),
    );
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
          items: cart.map((item) => ({
            stockItemId: item.stockItemId || undefined,
            productId: item.productId || item.id,
            price: Number(item.salePrice || 0),
            quantity: Number(item.quantity || 1),
          })),
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
    <AppLayout title="Sales / POS" subtitle="Mahsulot nomi, modeli, turi yoki shtrixkod orqali tez sotuv.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="grid grid-cols-[1.35fr_0.65fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[var(--text)]">Sotuv savatchasi</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                Tovar nomi, model, kategoriya, shtrixkod yoki SKU yozing. Masalan: LG, 43, hof, kir.
              </p>
            </div>
            <div className="rounded-[18px] bg-[var(--soft)] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Jami</p>
              <p className="mt-1 text-[24px] tracking-[-0.04em] text-[var(--text)]">{money(total, currency)}</p>
            </div>
          </div>

          <div className="relative mt-5 flex gap-3 max-md:flex-col">
            <div className="relative flex-1">
              <PackageSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => suggestions.length && setSuggestOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.min(current + 1, suggestions.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.max(current - 1, 0));
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    scanOrAddFirst();
                  }
                  if (event.key === "Escape") setSuggestOpen(false);
                }}
                placeholder="Mahsulot qidirish: nomi, modeli, turi yoki shtrixkod..."
                className="premium-input pl-12"
              />

              {suggestOpen && suggestions.length ? (
                <div className="absolute left-0 right-0 z-30 mt-2 max-h-[420px] overflow-auto rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                  {suggestions.map((product, index) => (
                    <button
                      key={`${product.productId || product.id}-${index}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addProduct(product)}
                      className={`w-full rounded-[18px] px-4 py-3 text-left transition ${index === selectedIndex ? "bg-[var(--soft)]" : "hover:bg-[var(--soft)]"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-[15px] font-medium text-[var(--text)]">{product.name || product.productName}</p>
                          <p className="mt-1 line-clamp-1 text-[12px] text-[var(--muted)]">
                            {cleanText(product.sku || product.model) || "model yo‘q"} · {cleanText(product.category) || "kategoriya yo‘q"} · {cleanText(product.barcode) || "shtrixkod yo‘q"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[14px] font-medium text-[var(--text)]">{money(product.salePrice || 0, product.currency || currency)}</p>
                          <p className="mt-1 text-[12px] text-[var(--muted)]">{num(product.stock || 0)} dona</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button type="button" onClick={scanOrAddFirst} className="premium-button premium-button-primary h-12 px-6">
              Qo‘shish
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[var(--soft)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr>
                  <th className="p-4 font-normal">Mahsulot</th>
                  <th className="p-4 font-normal">Model / SKU</th>
                  <th className="p-4 font-normal">Kategoriya</th>
                  <th className="p-4 text-center font-normal">Soni</th>
                  <th className="p-4 text-right font-normal">Narx</th>
                  <th className="p-4 text-right font-normal">Summa</th>
                  <th className="p-4 text-right font-normal">Amal</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.cartId} className="border-t border-[var(--border)]">
                    <td className="p-4">
                      <p className="line-clamp-1 font-medium text-[var(--text)]">{item.name || item.productName}</p>
                      <p className="mt-1 text-[12px] text-[var(--muted)]">{item.barcode || item.warehouseName || "—"}</p>
                    </td>
                    <td className="p-4 text-[var(--muted)]">{item.sku || item.model || "—"}</td>
                    <td className="p-4 text-[var(--muted)]">{item.category || "—"}</td>
                    <td className="p-4">
                      <div className="mx-auto flex w-[110px] items-center justify-between rounded-[16px] bg-[var(--soft)] px-2 py-1">
                        <button type="button" onClick={() => changeQty(item.cartId, -1)} className="h-8 w-8 rounded-[12px] hover:bg-[var(--card)]">−</button>
                        <span className="text-[14px] text-[var(--text)]">{item.quantity}</span>
                        <button type="button" onClick={() => changeQty(item.cartId, 1)} className="h-8 w-8 rounded-[12px] hover:bg-[var(--card)]">+</button>
                      </div>
                    </td>
                    <td className="p-4 text-right text-[var(--text)]">{money(item.salePrice, item.currency || currency)}</td>
                    <td className="p-4 text-right font-medium text-[var(--text)]">{money(item.salePrice * item.quantity, item.currency || currency)}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setCart((current) => current.filter((x) => x.cartId !== item.cartId))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[var(--muted)] hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!cart.length ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-[var(--muted)]">
                      Savatcha bo‘sh. Mahsulot nomi yoki modelini yozing.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card p-6">
          <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[var(--text)]">Checkout</h2>
          <div className="mt-5 space-y-4">
            <Field label="Valyuta"><CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} /></Field>
            <Field label="To‘lov turi"><CustomSelect value={method} onChange={setMethod} options={methodOptions} /></Field>
            <Field label="Chegirma"><PremiumInput value={discount} onChange={setDiscount} /></Field>
            <Field label="Mijoz"><PremiumInput value={customerName} onChange={setCustomerName} /></Field>
            <Field label="Telefon"><PremiumInput value={customerPhone} onChange={setCustomerPhone} /></Field>
          </div>

          <div className="mt-6 rounded-[22px] bg-[var(--soft)] p-5">
            <div className="flex justify-between text-[14px] text-[var(--muted)]"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
            <div className="mt-3 flex justify-between text-[26px] font-normal tracking-[-0.04em] text-[var(--text)]"><span>Total</span><span>{money(total, currency)}</span></div>
          </div>
          <button onClick={checkout} className="premium-button premium-button-primary mt-5 w-full">Sotuvni yakunlash</button>
        </div>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">Oxirgi sotuvlar</h2>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--border)]">
          <table className="w-full text-left text-[14px]">
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t border-[var(--border)]">
                  <td className="p-4">{sale.saleNumber || sale.id.slice(0, 8)}</td>
                  <td className="p-4 text-[var(--muted)]">{dateText(sale.createdAt)}</td>
                  <td className="p-4 text-[var(--muted)]">{sale.method || "—"}</td>
                  <td className="p-4 text-right">{money(sale.totalAmount, sale.currency)}</td>
                </tr>
              ))}
              {!sales.length ? <tr><td colSpan={4} className="p-8 text-center text-[var(--muted)]">Sotuvlar yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
