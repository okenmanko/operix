"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Client = {
  id: string;
  fullName?: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method?: string | null;
  comment?: string | null;
  createdAt?: string;
};

type Debt = {
  id: string;
  amount: number;
  currency: string;
  status?: string;
  dueDate?: string | null;
  comment?: string | null;
  paidAmount?: number;
  remainingAmount?: number;
  client?: Client | null;
  payments?: Payment[];
};

type ImportResult = {
  ok?: boolean;
  message?: string;
  rows?: number;
  debtsCreated?: number;
  skipped?: number;
  totalUZS?: number;
  totalUSD?: number;
  errors?: Array<{ row: number; reason: string }>;
};

type Filter = "open" | "overdue" | "paid" | "closed" | "all";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "open", label: "Ochiq" },
  { key: "overdue", label: "Kechikkan" },
  { key: "paid", label: "To‘langan" },
  { key: "closed", label: "Yopilgan" },
  { key: "all", label: "Hammasi" },
];

export default function DebtsPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [currency, setCurrency] = useState("ALL");
  const [openId, setOpenId] = useState("");
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentComment, setPaymentComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await apiJson<Debt[]>("/debts");
      setDebts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Qarzlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enriched = useMemo(() => debts.map(enrichDebt), [debts]);

  const totals = useMemo(() => {
    return enriched.reduce(
      (acc, item) => {
        if (item.remaining <= 0) return acc;
        if (item.currency === "USD") acc.usd += item.remaining;
        else acc.uzs += item.remaining;
        acc.count += 1;
        if (item.isOverdue) acc.overdue += 1;
        return acc;
      },
      { count: 0, overdue: 0, uzs: 0, usd: 0 },
    );
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return enriched.filter((item) => {
      if (currency !== "ALL" && item.currency !== currency) return false;
      if (filter === "open" && item.remaining <= 0) return false;
      if (filter === "overdue" && !item.isOverdue) return false;
      if (filter === "paid" && item.paid <= 0) return false;
      if (filter === "closed" && item.remaining > 0) return false;

      if (!q) return true;
      return [item.clientName, item.phone, item.productNote, item.comment]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [enriched, query, filter, currency]);

  async function importExcel(file: File) {
    try {
      setImporting(true);
      setError("");
      setNotice("");
      setImportResult(null);

      const form = new FormData();
      form.append("file", file);
      form.append("mode", "replace");

      const result = await apiJson<ImportResult>("/debts/import-excel", {
        method: "POST",
        body: form,
      });

      setImportResult(result);
      setNotice(result?.message || "Excel import yakunlandi");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Excel import ishlamadi");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function createPayment() {
    if (!paymentDebt) return;
    const amount = parseAmount(paymentAmount);
    if (amount <= 0) {
      setError("To‘lov summasini kiriting");
      return;
    }

    try {
      setError("");
      setNotice("");
      await apiJson("/payments", {
        method: "POST",
        body: JSON.stringify({
          debtId: paymentDebt.id,
          amount,
          currency: normalizeCurrency(paymentDebt.currency),
          method: paymentMethod,
          comment: paymentComment || "Qarz bo‘yicha to‘lov",
        }),
      });
      setNotice("To‘lov saqlandi");
      setPaymentDebt(null);
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setPaymentComment("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov saqlanmadi");
    }
  }

  return (
    <AppLayout title="Qarzlar" subtitle="Excel / 1C qarzdorlar. Kollektor uchun sodda ro‘yxat va tez to‘lov kiritish.">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importExcel(file);
        }}
      />

      {error ? <Alert tone="red" text={error} onClose={() => setError("")} /> : null}
      {notice ? <Alert tone="green" text={notice} onClose={() => setNotice("")} /> : null}

      <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Ochiq qarzdor" value={`${num(totals.count)} ta`} />
        <Stat label="Kechikkan" value={`${num(totals.overdue)} ta`} />
        <Stat label="UZS qoldiq" value={money(totals.uzs, "UZS")} />
        <Stat label="USD qoldiq" value={money(totals.usd, "USD")} />
      </section>

      <section className="mb-5 rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.05em] text-[var(--text)]">Excel qarz markazi</h2>
            <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
              Import bosilganda eski qarzlar tozalanadi. Excel yagona manba bo‘ladi.
            </p>
            {importResult ? (
              <p className="mt-2 text-[12px] text-[var(--muted)]">
                Qator: {num(importResult.rows || 0)} · Qarz: {num(importResult.debtsCreated || 0)} · Skip: {num(importResult.skipped || 0)}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3 max-md:flex-col">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={importing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[#315efb] px-5 text-[13px] font-medium text-white shadow-[0_14px_30px_rgba(49,94,251,0.22)] disabled:opacity-60"
            >
              <Upload size={17} /> {importing ? "Import..." : "Excel import"}
            </button>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/debts/export-excel`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-5 text-[13px] text-[var(--text)]"
            >
              <Download size={17} /> Excel export
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_360px] gap-5 max-2xl:grid-cols-1">
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-4 max-xl:flex-col max-xl:items-stretch">
            <div>
              <h2 className="text-[22px] font-normal tracking-[-0.05em] text-[var(--text)]">Qarzdorlar</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Avval faqat ism ko‘rinadi. Bosilganda detallar ochiladi.</p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[#315efb] px-5 text-[13px] font-medium text-white">
              <Plus size={17} /> Qarz qo‘shish
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`h-10 rounded-[14px] px-4 text-[13px] transition ${
                  filter === item.key
                    ? "bg-[#315efb] text-white"
                    : "bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-[1fr_180px] gap-3 max-md:grid-cols-1">
            <label className="flex h-12 items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4">
              <Search size={18} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Mijoz, telefon, mahsulot yoki izoh..."
                className="h-full flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="h-12 rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[14px] text-[var(--text)] outline-none"
            >
              <option value="ALL">Barcha valuta</option>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
          </div>

          <div className="space-y-2">
            {filtered.map((debt) => {
              const isOpen = openId === debt.id;
              return (
                <article key={debt.id} className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--soft)]">
                  <button
                    onClick={() => setOpenId(isOpen ? "" : debt.id)}
                    className="grid w-full grid-cols-[1fr_150px_150px_42px] items-center gap-3 px-4 py-4 text-left max-lg:grid-cols-[1fr_110px_42px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-[var(--text)]">{debt.clientName}</p>
                      <p className="mt-1 text-[12px] text-[var(--muted)]">{debt.phone || "telefon yo‘q"}</p>
                    </div>
                    <div className="text-right max-lg:hidden">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Muddat</p>
                      <p className="mt-1 text-[13px] text-[var(--text)]">{formatDate(debt.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Qoldiq</p>
                      <p className="mt-1 text-[15px] font-medium text-[var(--text)]">{money(debt.remaining, debt.currency)}</p>
                    </div>
                    <ChevronDown className={`text-[var(--muted)] transition ${isOpen ? "rotate-180" : ""}`} size={18} />
                  </button>

                  {isOpen ? (
                    <div className="border-t border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
                        <Info label="Jami qarz" value={money(debt.amount, debt.currency)} />
                        <Info label="To‘langan" value={money(debt.paid, debt.currency)} />
                        <Info label="Oxirgi to‘lov" value={debt.lastPaymentText} />
                        <Info label="Holat" value={debt.statusText} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
                        <Info label="Nima olgan" value={debt.productNote || "Excel izohida mahsulot yo‘q"} wide />
                        <Info label="Izoh" value={debt.cleanComment || "Izoh yo‘q"} wide />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setPaymentDebt(debt);
                            setPaymentAmount(String(debt.remaining || ""));
                            setPaymentComment("");
                          }}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#315efb] px-4 text-[13px] text-white"
                        >
                          <CheckCircle2 size={16} /> To‘lov kiritish
                        </button>
                      </div>

                      {debt.payments?.length ? (
                        <div className="mt-4 rounded-[16px] border border-[var(--border)]">
                          {debt.payments.slice(0, 5).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
                              <div>
                                <p className="text-[13px] text-[var(--text)]">{money(Number(payment.amount || 0), payment.currency || debt.currency)}</p>
                                <p className="text-[12px] text-[var(--muted)]">{payment.method || "method"} · {payment.comment || "izoh yo‘q"}</p>
                              </div>
                              <p className="text-[12px] text-[var(--muted)]">{formatDate(payment.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}

            {!filtered.length ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--soft)] p-10 text-center text-[var(--muted)]">
                Qarzdor topilmadi.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <h3 className="text-[20px] font-normal tracking-[-0.05em] text-[var(--text)]">Oxirgi to‘lovlar</h3>
            <div className="mt-4 space-y-2">
              {enriched
                .flatMap((debt) => (debt.payments || []).map((p) => ({ ...p, clientName: debt.clientName, debtCurrency: debt.currency })))
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 7)
                .map((payment) => (
                  <div key={payment.id} className="rounded-[16px] bg-[var(--soft)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] text-[var(--text)]">{payment.clientName}</p>
                      <p className="text-[13px] text-[var(--text)]">{money(Number(payment.amount || 0), payment.currency || payment.debtCurrency)}</p>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--muted)]">{formatDate(payment.createdAt)}</p>
                  </div>
                ))}
              {!enriched.some((d) => d.payments?.length) ? <p className="text-[13px] text-[var(--muted)]">To‘lovlar hali yo‘q.</p> : null}
            </div>
          </div>

          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <h3 className="text-[20px] font-normal tracking-[-0.05em] text-[var(--text)]">Kollektor eslatmasi</h3>
            <div className="mt-4 space-y-3 text-[13px] leading-5 text-[var(--muted)]">
              <p>1. Avval kechikkan qarzdorlar bilan bog‘laniladi.</p>
              <p>2. To‘lov kiritilganda qarz avtomatik kamayadi.</p>
              <p>3. “Nima olgan” Excel izohidan yoki qarz kommentidan olinadi.</p>
            </div>
          </div>
        </aside>
      </section>

      {paymentDebt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-normal tracking-[-0.05em] text-[var(--text)]">To‘lov kiritish</h3>
                <p className="mt-1 text-[13px] text-[var(--muted)]">{enrichDebt(paymentDebt).clientName}</p>
              </div>
              <button onClick={() => setPaymentDebt(null)} className="rounded-full bg-[var(--soft)] p-2 text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label={`Summa (${normalizeCurrency(paymentDebt.currency)})`}>
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="h-12 w-full rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[15px] text-[var(--text)] outline-none"
                  placeholder="0"
                />
              </Field>

              <Field label="To‘lov turi">
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-12 w-full rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[15px] text-[var(--text)] outline-none"
                >
                  <option value="CASH">Naqd</option>
                  <option value="CARD">Karta</option>
                  <option value="TRANSFER">Bank / Perechisleniya</option>
                </select>
              </Field>

              <Field label="Izoh">
                <input
                  value={paymentComment}
                  onChange={(event) => setPaymentComment(event.target.value)}
                  className="h-12 w-full rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[15px] text-[var(--text)] outline-none"
                  placeholder="Masalan: kollektor orqali"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPaymentDebt(null)} className="h-11 rounded-[15px] bg-[var(--soft)] px-5 text-[13px] text-[var(--text)]">
                Bekor qilish
              </button>
              <button onClick={createPayment} className="h-11 rounded-[15px] bg-[#315efb] px-5 text-[13px] font-medium text-white">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

function enrichDebt(debt: Debt) {
  const currency = normalizeCurrency(debt.currency);
  const amount = Number(debt.amount || 0);
  const paid = Number(debt.paidAmount ?? (debt.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0));
  const remaining = Math.max(0, Number(debt.remainingAmount ?? amount - paid));
  const dueDate = debt.dueDate || null;
  const isOverdue = remaining > 0 && dueDate ? new Date(dueDate).getTime() < startOfToday().getTime() : false;
  const comment = String(debt.comment || "");
  const lastPayment = [...(debt.payments || [])].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

  return {
    ...debt,
    currency,
    amount,
    paid,
    remaining,
    isOverdue,
    clientName: debt.client?.fullName || debt.client?.name || "Nomsiz mijoz",
    phone: debt.client?.phone || "",
    productNote: extractProductNote(comment, currency),
    cleanComment: cleanComment(comment),
    lastPaymentText: lastPayment ? `${money(Number(lastPayment.amount || 0), lastPayment.currency || currency)} · ${formatDate(lastPayment.createdAt)}` : "to‘lov yo‘q",
    statusText: remaining <= 0 ? "Yopilgan" : isOverdue ? "Kechikkan" : "Ochiq",
  };
}

function extractProductNote(comment: string, currency: string) {
  const text = cleanComment(comment);
  if (!text) return `QARZ13 · ${currency}`;
  return text.replace(/^QARZ13[:\s-]*/i, "") || `QARZ13 · ${currency}`;
}

function cleanComment(comment: string) {
  return String(comment || "")
    .replace(/EXCEL_IMPORT:?/gi, "")
    .replace(/QARZ13[:\s-]*/gi, "")
    .trim();
}

function normalizeCurrency(value: any) {
  const raw = String(value || "UZS").toUpperCase();
  return raw.includes("USD") || raw.includes("$") || raw.includes("ДОЛ") ? "USD" : "UZS";
}

function parseAmount(value: string) {
  const clean = String(value || "").replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const normalized = clean.includes(".") ? clean.replace(/\.(?=.*\.)/g, "") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function Alert({ tone, text, onClose }: { tone: "green" | "red"; text: string; onClose: () => void }) {
  return (
    <div className={`mb-5 flex items-center justify-between gap-4 rounded-[18px] border px-5 py-4 text-[14px] ${tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
      <span>{text}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_14px_44px_rgba(15,23,42,0.045)]">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-[26px] font-normal tracking-[-0.055em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[16px] bg-[var(--soft)] px-4 py-3 ${wide ? "min-h-[74px]" : ""}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-words text-[13px] text-[var(--text)]">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
