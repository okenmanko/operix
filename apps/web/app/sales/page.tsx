"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, Search, Trash2, Wallet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { Field, PremiumInput } from "../components/ui/Field";
import { Toast } from "../components/ui/Toast";
import { apiJson, dateText, money, num } from "../lib/api";

type ProductSuggestion = {
  id: string;
  productId: string;
  name: string;
  productName?: string;
  sku?: string | null;
  model?: string | null;
  barcode?: string | null;
  category?: string | null;
  brand?: string | null;
  warehouseName?: string | null;
  stockItemId?: string | null;
  stock?: number | null;
  salePrice: number;
  costPrice?: number | null;
  currency: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku?: string | null;
  model?: string | null;
  barcode?: string | null;
  category?: string | null;
  brand?: string | null;
  stock?: number | null;
  salePrice?: number | null;
  price?: number | null;
  costPrice?: number | null;
  currency?: string | null;
  warehouses?: Array<{ warehouseName?: string; quantity?: number; salePrice?: number; costPrice?: number }>;
};

type CartItem = ProductSuggestion & { cartId: string; quantity: number };

type Sale = {
  id: string;
  saleNumber?: string | null;
  totalAmount: number;
  currency: string;
  method?: string | null;
  createdAt: string;
};

const methodOptions = [
  { value: "CASH", label: "Naqd", icon: <Banknote size={17} /> },
  { value: "CARD", label: "Karta", icon: <CreditCard size={17} /> },
  { value: "TRANSFER", label: "Bank", icon: <Wallet size={17} /> },
];

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "UZS", label: "UZS" },
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function compact(value: unknown) {
  return normalize(value).replace(/\s+/g, "");
}

function scoreProduct(product: ProductSuggestion, query: string) {
  const q = normalize(query);
  const qc = compact(query);
  const terms = q.split(/\s+/).filter(Boolean);
  const text = [product.name, product.productName, product.sku, product.model, product.barcode, product.category, product.brand]
    .map(normalize)
    .join(" ");
  const textCompact = compact(text);
  let score = 0;

  if (!q) return 0;
  if (textCompact === qc) score += 1000;
  if (textCompact.startsWith(qc)) score += 500;
  if (textCompact.includes(qc)) score += 260;

  for (const term of terms) {
    const tc = compact(term);
    if (text.includes(term)) score += 60;
    if (textCompact.includes(tc)) score += 90;
    if (normalize(product.name).includes(term)) score += 80;
    if (normalize(product.sku).includes(term) || normalize(product.model).includes(term)) score += 120;
    if (normalize(product.barcode).includes(term)) score += 140;
  }

  return score;
}

function inventoryToSuggestion(row: InventoryProduct): ProductSuggestion {
  const warehouse = Array.isArray(row.warehouses) ? row.warehouses.find((x) => Number(x.quantity || 0) > 0) || row.warehouses[0] : undefined;
  return {
    id: row.id,
    productId: row.id,
    name: row.name,
    productName: row.name,
    sku: row.sku || row.model || "",
    model: row.model || row.sku || "",
    barcode: row.barcode || "",
    category: row.category || "",
    brand: row.brand || "",
    warehouseName: warehouse?.warehouseName || "",
    stockItemId: null,
    stock: Number(row.stock ?? warehouse?.quantity ?? 0),
    salePrice: Number(warehouse?.salePrice ?? row.salePrice ?? row.price ?? 0),
    costPrice: Number(warehouse?.costPrice ?? row.costPrice ?? 0),
    currency: row.currency || "USD",
  };
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
  const [loadingSearch, setLoadingSearch] = useState(false);
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
      setSales(rows.slice(0, 8));
    } catch {
      setSales([]);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  async function searchProducts(raw: string) {
    const q = raw.trim();
    if (!q) return [];
    setLoadingSearch(true);

    try {
      const apiRows = await apiJson<ProductSuggestion[]>(`/sales/search?q=${encodeURIComponent(q)}`);
      let rows = Array.isArray(apiRows) ? apiRows : [];

      // Qo'shimcha frontend fallback: agar /sales/search bo'sh qaytsa,
      // inventory katalogdan olib fuzzy qidiradi. Shu sabab "AS", "43", "hof" ham topiladi.
      if (rows.length < 3) {
        try {
          const inv = await apiJson<InventoryProduct[]>("/inventory/products");
          const extra = (Array.isArray(inv) ? inv : []).map(inventoryToSuggestion);
          const map = new Map<string, ProductSuggestion>();
          [...rows, ...extra].forEach((item) => map.set(item.productId || item.id, item));
          rows = [...map.values()];
        } catch {
          // backend search natijasini qoldiramiz
        }
      }

      return rows
        .map((item) => ({ item, score: scoreProduct(item, q) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((row) => row.item);
    } finally {
      setLoadingSearch(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!q) {
      setSuggestions([]);
      setSuggestOpen(false);
      setLoadingSearch(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const rows = await searchProducts(q);
        setSuggestions(rows);
        setSelectedIndex(0);
        setSuggestOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestOpen(true);
      }
    }, 140);

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
          (item.stockItemId || item.productId || item.id) === key ? { ...item, quantity: item.quantity + 1 } : item,
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

  async function addFirst() {
    const q = query.trim();
    if (!q) return;
    if (suggestions.length) {
      addProduct(suggestions[selectedIndex] || suggestions[0]);
      return;
    }

    try {
      setError("");
      const rows = await searchProducts(q);
      if (rows.length) {
        addProduct(rows[0]);
        return;
      }
      const item = await apiJson<ProductSuggestion>("/sales/scan", {
        method: "POST",
        body: JSON.stringify({ code: q }),
      });
      addProduct(item);
    } catch {
      setError("Mahsulot topilmadi. Nomi, modeli, SKU yoki shtrixkodini boshqacha yozing.");
      setSuggestOpen(true);
    }
  }

  function changeQty(cartId: string, delta: number) {
    setCart((current) =>
      current.map((item) => (item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
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
    <AppLayout title="Sotuv" subtitle="Mahsulot nomi, modeli, SKU, turi yoki shtrixkod orqali tez sotuv.">
      {error ? <Toast type="error">{error}</Toast> : null}

      <div className="grid grid-cols-[1.45fr_0.55fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-6">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <h2 className="text-[24px] font-normal tracking-[-0.04em] text-[var(--text)]">Mahsulot tanlash</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Masalan: <b>LG 43</b>, <b>AS-1500</b>, <b>hof</b>, <b>kir</b>, <b>kond</b>, shtrixkod.</p>
            </div>
            <div className="rounded-[18px] bg-[var(--soft)] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Jami</p>
              <p className="mt-1 text-[24px] tracking-[-0.04em] text-[var(--text)]">{money(total, currency)}</p>
            </div>
          </div>

          <div className="relative mt-5 flex gap-3 max-md:flex-col">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => query.trim() && setSuggestOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.min(current + 1, Math.max(0, suggestions.length - 1)));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.max(current - 1, 0));
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFirst();
                  }
                  if (event.key === "Escape") setSuggestOpen(false);
                }}
                placeholder="Tovar qidirish: nom, model, SKU, kategoriya..."
                className="premium-input pl-12"
              />

              {suggestOpen && query.trim() ? (
                <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                  {loadingSearch ? (
                    <div className="p-5 text-center text-[13px] text-[var(--muted)]">Qidirilmoqda...</div>
                  ) : suggestions.length ? (
                    <div className="max-h-[420px] overflow-auto p-2">
                      {suggestions.map((product, index) => (
                        <button
                          key={`${product.productId || product.id}-${index}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => addProduct(product)}
                          className={`grid w-full grid-cols-[1fr_110px_110px] items-center gap-4 rounded-[16px] px-4 py-3 text-left transition max-md:grid-cols-1 ${index === selectedIndex ? "bg-[var(--blue-soft)]" : "hover:bg-[var(--hover)]"}`}
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-[15px] font-semibold text-[var(--text)]">{product.name || product.productName}</p>
                            <p className="mt-1 line-clamp-1 text-[12px] text-[var(--muted)]">
                              {clean(product.sku || product.model) || "model yo‘q"} · {clean(product.category) || "kategoriya yo‘q"} · {clean(product.barcode) || "shtrixkod yo‘q"}
                            </p>
                          </div>
                          <div className="text-right max-md:text-left">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Qoldiq</p>
                            <p className="text-[14px] font-medium text-[var(--text)]">{num(product.stock || 0)} dona</p>
                          </div>
                          <div className="text-right max-md:text-left">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Narx</p>
                            <p className="text-[14px] font-semibold text-[var(--text)]">{money(product.salePrice || 0, product.currency || currency)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-[13px] text-[var(--muted)]">Mahsulot topilmadi. Masalan: LG, 43, hof, kir, model yoki shtrixkod yozing.</div>
                  )}
                </div>
              ) : null}
            </div>

            <button type="button" onClick={addFirst} className="premium-button premium-button-primary h-12 px-6">
              Qo‘shish
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[var(--soft)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr>
                  <th className="p-4 font-normal">Mahsulot</th>
                  <th className="p-4 font-normal">Model / SKU</th>
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
                      <p className="mt-1 text-[12px] text-[var(--muted)]">{item.category || item.barcode || "—"}</p>
                    </td>
                    <td className="p-4 text-[var(--muted)]">{item.sku || item.model || "—"}</td>
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
                      <button type="button" onClick={() => setCart((current) => current.filter((x) => x.cartId !== item.cartId))} className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[var(--muted)] hover:text-red-500">
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!cart.length ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[var(--muted)]">Savatcha bo‘sh. Avval mahsulot qidiring va tanlang.</td>
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
