"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { Toast } from "../components/ui/Toast";
import { apiJson, dateText, downloadFile, money, num } from "../lib/api";
import { can } from "../lib/permissions";
import { useI18n } from "../lib/i18n";

type Debt = {
  id: string;
  amount: number;
  currency: "USD" | "UZS";
  status: string;
  remainingAmount?: number;
  client?: { fullName: string; phone?: string | null };
};

type Payment = {
  id: string;
  amount: number;
  currency: "USD" | "UZS";
  method?: string | null;
  comment?: string | null;
  createdAt?: string;
  debt?: Debt;
};

const blank = { debtId: "", amount: "", currency: "UZS", method: "CASH", comment: "" };

export default function PaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [paymentsData, debtsData] = await Promise.all([
        apiJson<Payment[]>("/payments"),
        apiJson<Debt[]>("/debts"),
      ]);

      const nextPayments = Array.isArray(paymentsData) ? paymentsData : [];
      const activeDebts = Array.isArray(debtsData) ? debtsData.filter((debt) => debt.status !== "CLOSED") : [];
      setPayments(nextPayments);
      setDebts(activeDebts);

      if (!form.debtId && activeDebts[0]) {
        setForm((current) => ({ ...current, debtId: activeDebts[0].id, currency: activeDebts[0].currency }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lovlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return payments.filter((payment) => {
      const matchesQuery = !q ||
        (payment.debt?.client?.fullName || "").toLowerCase().includes(q) ||
        (payment.debt?.client?.phone || "").toLowerCase().includes(q) ||
        (payment.comment || "").toLowerCase().includes(q);
      const matchesMethod = methodFilter === "ALL" || payment.method === methodFilter;
      const matchesCurrency = currencyFilter === "ALL" || payment.currency === currencyFilter;
      return matchesQuery && matchesMethod && matchesCurrency;
    });
  }, [payments, query, methodFilter, currencyFilter]);

  const totalUZS = filtered.filter((p) => p.currency === "UZS").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalUSD = filtered.filter((p) => p.currency === "USD").reduce((s, p) => s + Number(p.amount || 0), 0);

  async function savePayment() {
    const amount = Number(form.amount || 0);
    if (!form.debtId) return setError("Qarz tanlanmagan");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Summa noto‘g‘ri");

    try {
      setError("");
      setSuccess("");
      await apiJson("/payments", {
        method: "POST",
        body: JSON.stringify({ ...form, amount }),
      });
      setModal(false);
      setForm(blank);
      setSuccess("To‘lov saqlandi va qarz statusi yangilandi");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov saqlanmadi");
    }
  }

  async function removePayment(id: string) {
    if (!confirm("To‘lov o‘chirilsinmi?")) return;
    try {
      setError("");
      await apiJson(`/payments/${id}`, { method: "DELETE" });
      setSuccess("To‘lov o‘chirildi va qarz qayta hisoblandi");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov o‘chirilmadi");
    }
  }

  async function exportExcel() {
    await downloadFile("/payments/export-excel", "operix-payments.xlsx");
  }

  function openModal() {
    const debt = debts[0];
    setForm(debt ? { ...blank, debtId: debt.id, currency: debt.currency } : blank);
    setModal(true);
  }

  const debtOptions = debts.map((debt) => ({
    value: debt.id,
    label: `${debt.client?.fullName || "Mijoz"} • ${money(debt.remainingAmount ?? debt.amount, debt.currency)}`,
  }));

  return (
    <AppLayout title={t("paymentsTitle")} subtitle={t("paymentsSubtitle")}>
      {error ? <Toast type="error">{error}</Toast> : null}
      {success ? <Toast type="success">{success}</Toast> : null}

      <div className="premium-card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[var(--text)]">{t("paymentActions")}</h2>
            <p className="mt-1 text-[13px] text-[var(--muted-2)]">{t("paymentActionsSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3 max-sm:w-full">
            {can("payments:create") ? <button onClick={openModal} className="premium-button premium-button-primary"><Plus size={17} /> {t("addPayment")}</button> : null}
            {can("payments:export") ? <button onClick={exportExcel} className="premium-button premium-button-soft"><Download size={17} /> {t("export")}</button> : null}
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <Stat label={t("payments")} value={`${num(filtered.length)} ta`} />
        <Stat label={t("totalUSD")} value={money(totalUSD, "USD")} />
        <Stat label={t("totalUZS")} value={money(totalUZS, "UZS")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 grid grid-cols-[1fr_190px_190px] gap-3 max-lg:grid-cols-1">
          <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[var(--input-line)] bg-[var(--input-bg)] px-4">
            <Search size={18} className="text-[var(--muted-2)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mijoz yoki izoh..." className="flex-1 bg-transparent text-[14px] text-[var(--text)] outline-none" />
          </div>
          <CustomSelect value={currencyFilter} onChange={setCurrencyFilter} options={[{ value: "ALL", label: "Hammasi" }, { value: "UZS", label: "UZS" }, { value: "USD", label: "USD" }]} />
          <CustomSelect value={methodFilter} onChange={setMethodFilter} options={[{ value: "ALL", label: "Barcha method" }, { value: "CASH", label: "Naqd" }, { value: "CARD", label: "Karta" }, { value: "TRANSFER", label: "Transfer" }]} />
        </div>

        <div className="overflow-auto rounded-[22px] border border-[var(--line-soft)] operix-scrollbar">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[var(--card-2)] text-[11px] uppercase tracking-[0.14em] text-[var(--muted-2)]">
              <tr>
                <th className="p-4 font-normal">{t("client")}</th>
                <th className="p-4 font-normal">{t("amount")}</th>
                <th className="p-4 font-normal">{t("method")}</th>
                <th className="p-4 font-normal">{t("date")}</th>
                <th className="p-4 text-right font-normal">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-10 text-center text-[var(--muted-2)]">{t("loading")}</td></tr> : null}
              {!loading && filtered.map((payment) => (
                <tr key={payment.id} className="border-t border-[var(--line-soft)]">
                  <td className="p-4 text-[var(--text)]">{payment.debt?.client?.fullName || "—"}</td>
                  <td className="p-4 text-[var(--text)]">{money(payment.amount, payment.currency)}</td>
                  <td className="p-4 text-[var(--muted)]">{payment.method || "—"}</td>
                  <td className="p-4 text-[var(--muted)]">{dateText(payment.createdAt)}</td>
                  <td className="p-4 text-right"><button onClick={() => removePayment(payment.id)} className="text-[13px] text-[var(--danger-text)]">{t("delete")}</button></td>
                </tr>
              ))}
              {!loading && !filtered.length ? <tr><td colSpan={5} className="p-10 text-center text-[var(--muted-2)]">{t("noPayments")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/35 px-4 backdrop-blur-[4px]">
          <div className="absolute left-1/2 top-1/2 w-full max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-[var(--line)] bg-[var(--card)] shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-7 py-5">
              <div><h2 className="text-[28px] font-normal tracking-[-0.05em] text-[var(--text)]">{t("addPayment")}</h2><p className="mt-1 text-[13px] text-[var(--muted-2)]">Qarz bo‘yicha qisman yoki to‘liq to‘lov.</p></div>
              <button onClick={() => setModal(false)} className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--card-2)] text-[var(--text)]"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-7 py-6 max-sm:grid-cols-1">
              <Label label={t("debtSelect")}><CustomSelect value={form.debtId} onChange={(value) => {
                const debt = debts.find((d) => d.id === value);
                setForm({ ...form, debtId: value, currency: debt?.currency || form.currency });
              }} options={debtOptions} /></Label>
              <Input label={t("amount")} value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
              <Label label={t("currency")}><CustomSelect value={form.currency} onChange={(value) => setForm({ ...form, currency: value })} options={[{ value: "UZS", label: "UZS" }, { value: "USD", label: "USD" }]} /></Label>
              <Label label={t("paymentType")}><CustomSelect value={form.method} onChange={(value) => setForm({ ...form, method: value })} options={[{ value: "CASH", label: "Naqd" }, { value: "CARD", label: "Karta" }, { value: "TRANSFER", label: "Transfer" }]} /></Label>
              <div className="col-span-2 max-sm:col-span-1"><Input label={t("comment")} value={form.comment} onChange={(value) => setForm({ ...form, comment: value })} /></div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--line-soft)] px-7 py-5 max-sm:flex-col">
              <button onClick={() => setModal(false)} className="premium-button premium-button-soft">{t("cancel")}</button>
              <button onClick={savePayment} className="premium-button premium-button-primary">{t("save")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-6"><p className="text-[13px] text-[var(--muted)]">{label}</p><p className="mt-5 text-[26px] font-normal tracking-[-0.05em] text-[var(--text)]">{value}</p></div>;
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="premium-label">{label}</span>{children}</label>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="premium-label">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input" /></label>;
}
