"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ClientsExcelTools from "../components/ClientsExcelTools";
import { apiJson, dateText, money, num } from "../lib/api";
import { can } from "../lib/permissions";

type Currency = "UZS" | "USD";
type DebtFilter = "ALL" | "OPEN" | "OVERDUE" | "PAID" | "CLOSED";

type Payment = {
  id: string;
  amount: number;
  currency: Currency;
  method?: string | null;
  comment?: string | null;
  createdAt?: string | null;
};

type Debt = {
  id: string;
  amount: number;
  currency: Currency;
  status: string;
  dueDate?: string | null;
  comment?: string | null;
  managerId?: string | null;
  paidAmount?: number;
  remainingAmount?: number;
  client?: {
    id: string;
    fullName: string;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  payments?: Payment[];
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState("ALL");
  const [filter, setFilter] = useState<DebtFilter>("OPEN");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Debt[]>("/debts");
      setDebts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Qarzlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const prepared = useMemo(() => {
    return debts.map((debt) => enrichDebt(debt));
  }, [debts]);

  const openDebts = prepared.filter((debt) => debt.viewStatus !== "PAID" && debt.viewStatus !== "CLOSED");
  const overdueDebts = prepared.filter((debt) => debt.viewStatus === "OVERDUE");
  const paidDebts = prepared.filter((debt) => debt.viewStatus === "PAID");
  const closedDebts = prepared.filter((debt) => debt.viewStatus === "CLOSED");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return prepared.filter((debt) => {
      const haystack = [
        debt.client?.fullName,
        debt.client?.phone,
        debt.client?.address,
        debt.comment,
        debt.collector,
        debt.purchase,
        debt.lastPayment?.comment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);
      const matchesCurrency = currency === "ALL" || debt.currency === currency;
      const matchesFilter =
        filter === "ALL" ||
        (filter === "OPEN" && debt.viewStatus !== "PAID" && debt.viewStatus !== "CLOSED") ||
        debt.viewStatus === filter;

      return matchesQuery && matchesCurrency && matchesFilter;
    });
  }, [prepared, query, currency, filter]);

  const totalUZS = openDebts
    .filter((debt) => debt.currency === "UZS")
    .reduce((sum, debt) => sum + debt.remaining, 0);

  const totalUSD = openDebts
    .filter((debt) => debt.currency === "USD")
    .reduce((sum, debt) => sum + debt.remaining, 0);

  const lastPayments = prepared
    .filter((debt) => debt.lastPayment)
    .sort((a, b) => Number(new Date(b.lastPayment?.createdAt || 0)) - Number(new Date(a.lastPayment?.createdAt || 0)))
    .slice(0, 3);

  async function exportExcel() {
    try {
      await downloadFileSafe("/debts/export-excel", "qanot-debts-export.xlsx");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export xatosi");
    }
  }

  return (
    <AppLayout title="Qarzlar" subtitle="Excel / 1C qarzdorlar, muddat, oxirgi to‘lov va kollektor nazorati.">
      {error ? (
        <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat label="Ochiq qarz" value={`${num(openDebts.length)} ta`} />
        <Stat label="Kechikkan" value={`${num(overdueDebts.length)} ta`} tone={overdueDebts.length ? "danger" : "default"} />
        <Stat label="UZS qoldiq" value={money(totalUZS, "UZS")} />
        <Stat label="USD qoldiq" value={money(totalUSD, "USD")} />
      </div>

      <div className="premium-card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">
              Qarz boshqaruvi
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              Kollektor uchun: kim, qancha, qachon to‘lagan, nima olgan va qachon kechikkan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {can("debts:create") ? (
              <button className="premium-button premium-button-primary">
                <span className="inline-flex items-center gap-2">
                  <Plus size={17} /> Qarz qo‘shish
                </span>
              </button>
            ) : null}

            {can("clients:export") ? (
              <button onClick={exportExcel} className="premium-button premium-button-soft">
                <span className="inline-flex items-center gap-2">
                  <Download size={17} /> Excel export
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ClientsExcelTools onDone={load} />

      <div className="mb-5 grid grid-cols-[1.4fr_0.9fr] gap-5 max-xl:grid-cols-1">
        <div className="premium-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[20px] font-normal tracking-[-0.04em] text-[var(--text)]">
              Kollektor ro‘yxati
            </h2>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={filter === "OPEN"} onClick={() => setFilter("OPEN")}>Ochiq</FilterButton>
              <FilterButton active={filter === "OVERDUE"} onClick={() => setFilter("OVERDUE")}>Kechikkan</FilterButton>
              <FilterButton active={filter === "PAID"} onClick={() => setFilter("PAID")}>To‘langan</FilterButton>
              <FilterButton active={filter === "CLOSED"} onClick={() => setFilter("CLOSED")}>Yopilgan</FilterButton>
              <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>Hammasi</FilterButton>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-[1fr_170px] gap-3 max-md:grid-cols-1">
            <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-4">
              <Search size={18} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Mijoz, telefon, mahsulot yoki izoh..."
                className="flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              />
            </div>

            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="premium-input">
              <option value="ALL">Barcha valuta</option>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((debt) => (
              <DebtCard key={debt.id} debt={debt} />
            ))}

            {!filtered.length ? (
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--soft)] p-10 text-center text-[var(--muted)]">
                Qarz topilmadi
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="premium-card p-5">
            <h2 className="text-[20px] font-normal tracking-[-0.04em] text-[var(--text)]">
              Oxirgi to‘lovlar
            </h2>
            <div className="mt-4 space-y-3">
              {lastPayments.map((debt) => (
                <div key={`last-${debt.id}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--soft)] p-4">
                  <p className="line-clamp-1 text-[14px] text-[var(--text)]">{debt.client?.fullName || "—"}</p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    {money(Number(debt.lastPayment?.amount || 0), debt.currency)} · {debt.lastPayment?.createdAt ? dateText(debt.lastPayment.createdAt) : "sana yo‘q"}
                  </p>
                </div>
              ))}
              {!lastPayments.length ? <p className="text-[13px] text-[var(--muted)]">To‘lovlar hali yo‘q.</p> : null}
            </div>
          </div>

          <div className="premium-card p-5">
            <h2 className="text-[20px] font-normal tracking-[-0.04em] text-[var(--text)]">
              Kollektor eslatmasi
            </h2>
            <div className="mt-4 space-y-3 text-[13px] text-[var(--muted)]">
              <p>• Kechikkan qarzlar birinchi ishlanadi.</p>
              <p>• Oxirgi to‘lov sanasi ko‘rinmasa, mijozga qayta bog‘lanish kerak.</p>
              <p>• “Nima olgan” ma’lumoti Excel izohidan yoki qarz kommentidan olinadi.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function DebtCard({ debt }: { debt: ReturnType<typeof enrichDebt> }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
      <div className="grid grid-cols-[1.2fr_0.85fr_0.85fr_0.75fr] gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="line-clamp-1 text-[15px] font-medium text-[var(--text)]">{debt.client?.fullName || "—"}</p>
            <StatusPill status={debt.viewStatus} />
          </div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{debt.client?.phone || "telefon yo‘q"}</p>
          <p className="mt-3 line-clamp-2 text-[13px] text-[var(--muted)]">
            Nima olgan: <span className="text-[var(--text)]">{debt.purchase || "ma’lumot yo‘q"}</span>
          </p>
        </div>

        <InfoBlock label="Qoldiq" value={money(debt.remaining, debt.currency)} strong />
        <InfoBlock label="Jami qarz" value={money(Number(debt.amount || 0), debt.currency)} />
        <InfoBlock label="Muddat" value={debt.dueDate ? dateText(debt.dueDate) : "—"} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <InfoBlock label="To‘langan" value={money(debt.paid, debt.currency)} />
        <InfoBlock label="Oxirgi to‘lov" value={debt.lastPayment ? `${money(Number(debt.lastPayment.amount || 0), debt.currency)} · ${debt.lastPayment.createdAt ? dateText(debt.lastPayment.createdAt) : "sana yo‘q"}` : "to‘lov yo‘q"} />
        <InfoBlock label="Kollektor" value={debt.collector || "biriktirilmagan"} />
        <InfoBlock label="Izoh" value={debt.comment || "—"} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[13px] font-normal text-[var(--muted)]">{label}</p>
      <p className={`mt-4 text-[28px] font-normal tracking-[-0.05em] ${tone === "danger" ? "text-[#ef4444]" : "text-[var(--text)]"}`}>
        {value}
      </p>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-[14px] px-4 text-[13px] transition ${
        active
          ? "bg-[#315efb] text-white shadow-[0_12px_25px_rgba(49,94,251,0.18)]"
          : "bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof enrichDebt>["viewStatus"] }) {
  const map = {
    OPEN: "Qoldiq bor",
    OVERDUE: "Kechikkan",
    PAID: "To‘langan",
    CLOSED: "Yopilgan",
  } as const;

  const cls =
    status === "OVERDUE"
      ? "bg-red-50 text-red-600"
      : status === "PAID" || status === "CLOSED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#eef4ff] text-[#315efb]";

  return <span className={`rounded-full px-3 py-1 text-[11px] ${cls}`}>{map[status]}</span>;
}

function InfoBlock({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="rounded-[16px] bg-[var(--soft)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className={`mt-1 line-clamp-2 text-[13px] ${strong ? "font-medium text-[var(--text)]" : "text-[var(--text)]"}`}>{value}</p>
    </div>
  );
}

function enrichDebt(debt: Debt) {
  const currency = debt.currency || "UZS";
  const paid = (debt.payments || [])
    .filter((payment) => payment.currency === currency)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remaining = Math.max(0, Number(debt.remainingAmount ?? Number(debt.amount || 0) - paid));
  const closedByStatus = String(debt.status || "").toUpperCase() === "CLOSED";
  const isPaid = remaining <= 0;
  const dueTime = debt.dueDate ? new Date(debt.dueDate).getTime() : 0;
  const isOverdue = !closedByStatus && !isPaid && dueTime > 0 && dueTime < Date.now();
  const lastPayment = [...(debt.payments || [])]
    .filter((payment) => payment.currency === currency)
    .sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0)))[0];

  const viewStatus: "OPEN" | "OVERDUE" | "PAID" | "CLOSED" = closedByStatus
    ? "CLOSED"
    : isPaid
      ? "PAID"
      : isOverdue
        ? "OVERDUE"
        : "OPEN";

  return {
    ...debt,
    paid,
    remaining,
    lastPayment,
    viewStatus,
    collector: extractField(debt.comment || debt.client?.notes || "", ["kollektor", "collector", "menedjer", "manager"]),
    purchase: extractPurchase(debt.comment || debt.client?.notes || ""),
  };
}

function extractField(text: string, keys: string[]) {
  const raw = String(text || "");
  for (const key of keys) {
    const regex = new RegExp(`${key}\\s*[:=-]\\s*([^;|,\\n]+)`, "i");
    const match = raw.match(regex);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractPurchase(text: string) {
  const raw = String(text || "").replace(/EXCEL_IMPORT:?/gi, "").trim();
  const fromKeys = extractField(raw, ["tovar", "mahsulot", "product", "sotib oldi", "olgan"]);
  if (fromKeys) return fromKeys;
  if (!raw) return "";
  return raw.length > 90 ? `${raw.slice(0, 90)}...` : raw;
}

async function downloadFileSafe(path: string, filename: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${base}${path}`, { credentials: "include" });

  if (!response.ok) throw new Error("Fayl yuklanmadi");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
