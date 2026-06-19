"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { apiJson, money, num } from "../lib/api";
import { useI18n } from "../lib/i18n";

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

const FILTERS: Array<{ key: Filter; labelKey: string; fallback: string }> = [
  { key: "open", labelKey: "open", fallback: "Ochiq" },
  { key: "overdue", labelKey: "overdue", fallback: "Kechikkan" },
  { key: "paid", labelKey: "paid", fallback: "To‘langan" },
  { key: "closed", labelKey: "closed", fallback: "Yopilgan" },
  { key: "all", labelKey: "all", fallback: "Hammasi" },
];

export default function DebtsPage() {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t("debtsLoadFailed", "Qarzlar yuklanmadi"));
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
      setError(t("enterPaymentAmount"));
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
          comment: paymentComment || t("paymentDebtComment", "Qarz bo‘yicha to‘lov"),
        }),
      });
      setNotice(t("paymentSaved"));
      setPaymentDebt(null);
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setPaymentComment("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("paymentFailed"));
    }
  }

  return (
    <AppLayout title={t("debtsTitle")} subtitle={t("debtsSubtitle")}>
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
        <Stat label={t("openDebtors")} value={`${num(totals.count)} ta`} />
        <Stat label={t("overdueDebtors")} value={`${num(totals.overdue)} ta`} />
        <Stat label={t("uzsRemaining")} value={money(totals.uzs, "UZS")} />
        <Stat label={t("usdRemaining")} value={money(totals.usd, "USD")} />
      </section>

      <section className="mb-5 rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("excelDebtCenter")}</h2>
            <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
              {t("excelDebtNote")}
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
              className="qanot-button qanot-button-primary h-11 min-h-11 px-5 text-[13px] disabled:opacity-60"
            >
              <Upload size={17} /> {importing ? t("importing") : t("excelImport")}
            </button>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/debts/export-excel`}
              className="qanot-button qanot-button-soft h-11 min-h-11 px-5 text-[13px]"
            >
              <Download size={17} /> {t("excelExport")}
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_360px] gap-5 max-2xl:grid-cols-1">
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between gap-4 max-xl:flex-col max-xl:items-stretch">
            <div>
              <h2 className="text-[22px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("debtorsList")}</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">{t("debtorsListNote")}</p>
            </div>
            <button className="qanot-button qanot-button-primary h-11 min-h-11 px-5 text-[13px]">
              <Plus size={17} /> {t("addDebt")}
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
                placeholder={t("searchDebtor")}
                className="h-full flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <CustomSelect
              value={currency}
              onChange={setCurrency}
              options={[
                { value: "ALL", label: t("allCurrency") },
                { value: "USD", label: t("usd") },
                { value: "UZS", label: t("uzs") },
              ]}
            />
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
                      <p className="mt-1 text-[12px] text-[var(--muted)]">{debt.phone || t("noPhone")}</p>
                    </div>
                    <div className="text-right max-lg:hidden">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{t("dueDate")}</p>
                      <p className="mt-1 text-[13px] text-[var(--text)]">{formatDate(debt.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{t("remaining")}</p>
                      <p className="mt-1 text-[15px] font-medium text-[var(--text)]">{money(debt.remaining, debt.currency)}</p>
                    </div>
                    <ChevronDown className={`text-[var(--muted)] transition ${isOpen ? "rotate-180" : ""}`} size={18} />
                  </button>

                  {isOpen ? (
                    <div className="border-t border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
                        <Info label={t("totalDebt")} value={money(debt.amount, debt.currency)} />
                        <Info label={t("paidAmount")} value={money(debt.paid, debt.currency)} />
                        <Info label={t("lastPayment")} value={debt.lastPaymentText} />
                        <Info label={t("status")} value={debt.statusText} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
                        <Info label={t("productBought")} value={debt.productNote || t("noProductInfo")} wide />
                        <Info label={t("note")} value={debt.cleanComment || t("noComment")} wide />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setPaymentDebt(debt);
                            setPaymentAmount(String(debt.remaining || ""));
                            setPaymentComment("");
                          }}
                          className="qanot-button qanot-button-primary h-10 min-h-10 px-4 text-[13px]"
                        >
                          <CheckCircle2 size={16} /> {t("addPayment")}
                        </button>
                      </div>

                      {debt.payments?.length ? (
                        <div className="mt-4 rounded-[16px] border border-[var(--border)]">
                          {debt.payments.slice(0, 5).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
                              <div>
                                <p className="text-[13px] text-[var(--text)]">{money(Number(payment.amount || 0), payment.currency || debt.currency)}</p>
                                <p className="text-[12px] text-[var(--muted)]">{payment.method || "method"} · {payment.comment || t("noComment")}</p>
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
                {t("noDebtorFound")}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-[20px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("latestPayments")}</h3>
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
              {!enriched.some((d) => d.payments?.length) ? <p className="text-[13px] text-[var(--muted)]">{t("noPaymentsYet")}</p> : null}
            </div>
          </div>

          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-[20px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("collectorNote")}</h3>
            <div className="mt-4 space-y-3 text-[13px] leading-5 text-[var(--muted)]">
              <p>1. {t("collectorNote1")}</p>
              <p>2. {t("collectorNote2")}</p>
              <p>3. {t("collectorNote3")}</p>
            </div>
          </div>
        </aside>
      </section>

      {paymentDebt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("addPayment")}</h3>
                <p className="mt-1 text-[13px] text-[var(--muted)]">{enrichDebt(paymentDebt).clientName}</p>
              </div>
              <button onClick={() => setPaymentDebt(null)} className="rounded-full bg-[var(--soft)] p-2 text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label={`${t("paymentAmount")} (${normalizeCurrency(paymentDebt.currency)})`}>
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="h-12 w-full rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[15px] text-[var(--text)] outline-none"
                  placeholder="0"
                />
              </Field>

              <Field label={t("paymentMethod")} >
                <CustomSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: "CASH", label: t("cash") },
                    { value: "CARD", label: t("card") },
                    { value: "TRANSFER", label: t("transfer") },
                  ]}
                />
              </Field>

              <Field label={t("note")}>
                <input
                  value={paymentComment}
                  onChange={(event) => setPaymentComment(event.target.value)}
                  className="h-12 w-full rounded-[16px] border border-[var(--border)] bg-[var(--soft)] px-4 text-[15px] text-[var(--text)] outline-none"
                  placeholder={t("notePlaceholder", "Masalan: kollektor orqali")}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPaymentDebt(null)} className="qanot-button qanot-button-soft h-11 min-h-11 px-5 text-[13px]">
                {t("cancel")}
              </button>
              <button onClick={createPayment} className="qanot-button qanot-button-primary h-11 min-h-11 px-5 text-[13px]">
                {t("save")}
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
