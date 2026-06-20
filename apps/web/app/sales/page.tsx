"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, Minus, PackageSearch, Plus, Trash2, Wallet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, dateText, money, num } from "../lib/api";
import CustomSelect from "../components/ui/CustomSelect";
import { Field, PremiumInput } from "../components/ui/Field";
import { Toast } from "../components/ui/Toast";

type ProductSuggestion = {
  id: string;
  productId?: string;
  name: string;
  productName?: string;
  sku?: string | null;
  model?: string | null;
  barcode?: string | null;
  category?: string | null;
  warehouseName?: string | null;
  stockItemId?: string | null;
  stock?: number | null;
  salePrice?: number | null;
  costPrice?: number | null;
  price?: number | null;
  currency?: string | null;
};

type CartItem = ProductSuggestion & { cartId: string; quantity: number; salePrice: number; currency: string };
type Sale = { id: string; saleNumber?: string | null; totalAmount: number; currency: string; method?: string | null; createdAt: string };

const methodOptions = [
  { value: "CASH", label: "Naqd", icon: <Banknote size={18} /> },
  { value: "CARD", label: "Karta", icon: <CreditCard size={18} /> },
  { value: "TRANSFER", label: "Transfer", icon: <Wallet size={18} /> },
];
const currencyOptions = [{ value: "USD", label: "USD" }, { value: "UZS", label: "UZS" }];

function n(value: unknown) { const x = Number(value || 0); return Number.isFinite(x) ? x : 0; }
function clean(value: unknown) { return String(value || "").trim(); }
function searchable(value: unknown) { return clean(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim(); }
function productKey(p: ProductSuggestion) { return clean(p.stockItemId || p.productId || p.id || p.barcode || p.sku || p.name); }

function localSearch(products: ProductSuggestion[], query: string) {
  const q = searchable(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return products
    .map((p) => {
      const haystack = searchable([p.name, p.productName, p.sku, p.model, p.barcode, p.category].join(" "));
      let score = 0;
      if (haystack.includes(q)) score += 80;
      for (const term of terms) {
        if (haystack.includes(term)) score += 20;
        if (searchable(p.name).startsWith(term)) score += 15;
        if (searchable(p.sku).startsWith(term) || searchable(p.model).startsWith(term)) score += 12;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.p);
}

export default function SalesPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [allProducts, setAllProducts] = useState<ProductSuggestion[]>([]);
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
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + n(item.salePrice) * n(item.quantity || 1), 0), [cart]);
  const total = Math.max(subtotal - n(discount), 0);

  async function loadSales() {
    try {
      const data = await apiJson<any>(`/sales?currency=${currency}`);
      setSales(Array.isArray(data) ? data : Array.isArray(data?.sales) ? data.sales : []);
    } catch { setSales([]); }
  }

  async function loadProductsFallback() {
    try {
      const data = await apiJson<any[]>("/inventory/products");
      const rows = Array.isArray(data) ? data : [];
      setAllProducts(rows.map((p: any) => ({
        id: p.id,
        productId: p.productId || p.id,
        name: p.name || p.productName || "Tovar",
        productName: p.productName || p.name,
        sku: p.sku || p.model || "",
        model: p.model || p.sku || "",
        barcode: p.barcode || "",
        category: p.category || "",
        stock: n(p.stock ?? p.quantity ?? 0),
        salePrice: n(p.salePrice ?? p.price ?? 0),
        costPrice: n(p.costPrice ?? 0),
        currency: p.currency || "USD",
      })));
    } catch { setAllProducts([]); }
  }

  useEffect(() => { loadProductsFallback(); }, []);
  useEffect(() => { loadSales(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currency]);

  useEffect(() => {
    const q = query.trim();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q) { setSuggestions([]); setSuggestOpen(false); return; }

    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        let rows: ProductSuggestion[] = [];
        try {
          const data = await apiJson<ProductSuggestion[]>(`/sales/search?q=${encodeURIComponent(q)}`);
          rows = Array.isArray(data) ? data : [];
        } catch { rows = []; }
        const fallback = localSearch(allProducts, q);
        const merged = [...rows, ...fallback].filter(Boolean);
        const unique = Array.from(new Map(merged.map((p) => [productKey(p), p])).values()).slice(0, 12);
        setSuggestions(unique);
        setSelectedIndex(0);
        setSuggestOpen(true);
      } finally { setLoading(false); }
    }, 120);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, allProducts]);

  function addProduct(product: ProductSuggestion) {
    if (!product) return;
    setError("");
    const key = productKey(product);
    setCart((current) => {
      const exists = current.find((item) => productKey(item) === key);
      if (exists) return current.map((item) => productKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, {
        ...product,
        productId: product.productId || product.id,
        cartId: `${key}-${Date.now()}`,
        quantity: 1,
        currency: product.currency || currency,
        salePrice: n(product.salePrice ?? product.price),
      }];
    });
    setQuery("");
    setSuggestions([]);
    setSuggestOpen(false);
  }

  async function addFirst() {
    const q = query.trim();
    if (!q) return;
    if (suggestions.length) return addProduct(suggestions[selectedIndex] || suggestions[0]);
    try {
      const item = await apiJson<ProductSuggestion>("/sales/scan", { method: "POST", body: JSON.stringify({ code: q }) });
      addProduct(item);
    } catch {
      const fallback = localSearch(allProducts, q)[0];
      if (fallback) addProduct(fallback);
      else setError("Mahsulot topilmadi. Nomi, modeli, SKU yoki shtrixkodini yozing.");
    }
  }

  function changeQty(cartId: string, delta: number) {
    setCart((current) => current.map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  async function checkout() {
    if (!cart.length) return setError("Savatcha bo‘sh");
    try {
      setError("");
      await apiJson("/sales/checkout", {
        method: "POST",
        body: JSON.stringify({
          method, currency, discount: n(discount), customerName, customerPhone,
          items: cart.map((item) => ({ stockItemId: item.stockItemId || undefined, productId: item.productId || item.id, price: n(item.salePrice), quantity: n(item.quantity || 1) })),
        }),
      });
      setCart([]); setDiscount("0"); setCustomerName(""); setCustomerPhone(""); await loadSales(); await loadProductsFallback();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Sotuv yakunlanmadi"); }
  }

  return (
    <AppLayout title="Sotuv" subtitle="Mahsulot nomi, modeli, SKU, turi yoki shtrixkod orqali tez sotuv.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="pos-grid">
        <div className="premium-card p-6">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <h2 className="text-[25px] font-extrabold tracking-[-0.055em] text-[var(--text)]">Mahsulot tanlash</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Masalan: <b>LG 43</b>, <b>AS-1500</b>, <b>hof</b>, <b>kir</b>, <b>kond</b>, shtrixkod.</p>
            </div>
            <div className="rounded-[20px] bg-[var(--soft)] px-5 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Jami</p>
              <p className="mt-1 text-[28px] font-extrabold tracking-[-0.055em] text-[var(--text)]">{money(total, currency)}</p>
            </div>
          </div>

          <div className="relative mt-5 flex gap-3 max-md:flex-col">
            <div className="relative flex-1">
              <PackageSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((v) => Math.min(v + 1, suggestions.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((v) => Math.max(v - 1, 0)); }
                  if (e.key === "Enter") { e.preventDefault(); addFirst(); }
                  if (e.key === "Escape") setSuggestOpen(false);
                }}
                placeholder="Tovar qidirish: nom, model, SKU, kategoriya, shtrixkod..."
                className="premium-input h-[54px] pl-12 text-[15px]"
                autoComplete="off"
              />
              {suggestOpen && query ? (
                <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                  {loading ? <div className="p-6 text-center text-[var(--muted)]">Qidirilyapti...</div> : null}
                  {!loading && suggestions.length ? (
                    <div className="max-h-[420px] overflow-auto p-2 qanot-scroll">
                      {suggestions.map((p, index) => (
                        <button key={`${productKey(p)}-${index}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addProduct(p)} className={`pos-suggestion ${index === selectedIndex ? "pos-suggestion-active" : ""}`}>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-extrabold tracking-[-0.02em]">{p.name || p.productName}</p>
                            <p className="mt-1 truncate text-[12px] text-[var(--muted)]">{clean(p.sku || p.model) || "model yo‘q"} · {clean(p.category) || "kategoriya yo‘q"} · {clean(p.barcode) || "shtrixkod yo‘q"}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[14px] font-extrabold">{money(n(p.salePrice ?? p.price), p.currency || currency)}</p>
                            <p className="mt-1 text-[12px] text-[var(--muted)]">{num(p.stock || 0)} dona</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {!loading && !suggestions.length ? <div className="p-6 text-center text-[var(--muted)]">Mahsulot topilmadi. Boshqacha yozib ko‘ring.</div> : null}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={addFirst} className="premium-button premium-button-primary h-[54px] px-7">Qo‘shish</button>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="pos-cart-row pos-cart-head border-0 pt-0">
              <span>Mahsulot</span><span>Soni</span><span>Narx</span><span className="text-right">Summa</span><span></span>
            </div>
            {cart.map((item) => (
              <div key={item.cartId} className="pos-cart-row">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-extrabold text-[var(--text)]">{item.name || item.productName}</p>
                  <p className="mt-1 truncate text-[12px] text-[var(--muted)]">{item.sku || item.model || "—"} · {item.category || "—"}</p>
                </div>
                <div className="flex w-[118px] items-center justify-between rounded-[16px] bg-[var(--soft)] px-2 py-1">
                  <button type="button" onClick={() => changeQty(item.cartId, -1)} className="h-8 w-8 rounded-[12px] hover:bg-[var(--card)]"><Minus size={14} className="mx-auto" /></button>
                  <span className="text-[14px] font-bold">{item.quantity}</span>
                  <button type="button" onClick={() => changeQty(item.cartId, 1)} className="h-8 w-8 rounded-[12px] hover:bg-[var(--card)]"><Plus size={14} className="mx-auto" /></button>
                </div>
                <div className="font-semibold">{money(item.salePrice, item.currency)}</div>
                <div className="text-right font-extrabold">{money(item.salePrice * item.quantity, item.currency)}</div>
                <button type="button" onClick={() => setCart((current) => current.filter((x) => x.cartId !== item.cartId))} className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[var(--muted)] hover:text-red-500"><Trash2 size={17} /></button>
              </div>
            ))}
            {!cart.length ? <div className="py-12 text-center text-[var(--muted)]">Savatcha bo‘sh. Avval mahsulot qidiring va tanlang.</div> : null}
          </div>
        </div>

        <div className="premium-card pos-search-panel p-6">
          <h2 className="text-[25px] font-extrabold tracking-[-0.055em]">Checkout</h2>
          <div className="mt-5 space-y-4">
            <Field label="Valyuta"><CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} /></Field>
            <Field label="To‘lov turi"><CustomSelect value={method} onChange={setMethod} options={methodOptions} /></Field>
            <Field label="Chegirma"><PremiumInput value={discount} onChange={setDiscount} /></Field>
            <Field label="Mijoz"><PremiumInput value={customerName} onChange={setCustomerName} /></Field>
            <Field label="Telefon"><PremiumInput value={customerPhone} onChange={setCustomerPhone} /></Field>
          </div>
          <div className="mt-6 rounded-[22px] bg-[var(--soft)] p-5">
            <div className="flex justify-between text-[14px] text-[var(--muted)]"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
            <div className="mt-3 flex justify-between text-[28px] font-extrabold tracking-[-0.055em]"><span>Total</span><span>{money(total, currency)}</span></div>
          </div>
          <button onClick={checkout} className="premium-button premium-button-primary mt-5 w-full">Sotuvni yakunlash</button>
        </div>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="text-[22px] font-extrabold tracking-[-0.04em]">Oxirgi sotuvlar</h2>
        <div className="mt-5 table-wrap">
          <table className="premium-table">
            <tbody>
              {sales.slice(0, 12).map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.saleNumber || sale.id.slice(0, 8)}</td>
                  <td className="muted">{dateText(sale.createdAt)}</td>
                  <td className="muted">{sale.method || "—"}</td>
                  <td className="cell-num font-bold">{money(sale.totalAmount, sale.currency)}</td>
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
