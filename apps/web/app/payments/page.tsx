"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CustomSelect from "../components/ui/CustomSelect";
import { apiJson, dateText, downloadFile, money, num } from "../lib/api";
import { can } from "../lib/permissions";

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [paymentsData, debtsData] = await Promise.all([
        apiJson<Payment[]>("/payments"),
        apiJson<Debt[]>("/debts"),
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      const activeDebts = Array.isArray(debtsData) ? debtsData.filter((debt) => debt.status !== "CLOSED") : [];
      setDebts(activeDebts);

      if (!form.debtId && activeDebts[0]) {
        setForm((current) => ({ ...current, debtId: activeDebts[0].id, currency: activeDebts[0].currency }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lovlar yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return payments.filter((payment) =>
      (payment.debt?.client?.fullName || "").toLowerCase().includes(q) ||
      (payment.debt?.client?.phone || "").toLowerCase().includes(q) ||
      (payment.comment || "").toLowerCase().includes(q),
    );
  }, [payments, query]);

  const totalUZS = payments.filter((p) => p.currency === "UZS").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalUSD = payments.filter((p) => p.currency === "USD").reduce((s, p) => s + Number(p.amount || 0), 0);

  async function savePayment() {
    try {
      setError("");
      await apiJson("/payments", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount || 0) }),
      });
      setModal(false);
      setForm(blank);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov saqlanmadi");
    }
  }

  async function removePayment(id: string) {
    if (!confirm("To‘lov o‘chirilsinmi?")) return;
    await apiJson(`/payments/${id}`, { method: "DELETE" });
    await load();
  }

  async function exportExcel() {
    await downloadFile("/payments/export-excel", "operix-payments.xlsx");
  }

  const debtOptions = debts.map((debt) => ({
    value: debt.id,
    label: `${debt.client?.fullName || "Mijoz"} • ${money(debt.remainingAmount ?? debt.amount, debt.currency)}`,
  }));

  return (
    <AppLayout title="To‘lovlar" subtitle="Qisman to‘lov, USD/UZS to‘lov va export.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}

      <div className="premium-card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-normal tracking-[-0.04em] text-[#111827]">To‘lov amallari</h2>
            <p className="mt-1 text-[13px] text-[#8aa0ba]">To‘lov qo‘shish, o‘chirish va Excel export.</p>
          </div>
          <div className="flex gap-3">
            {can("payments:create") ? <button onClick={() => setModal(true)} className="premium-button premium-button-primary"><Plus size={17} /> To‘lov qo‘shish</button> : null}
            {can("payments:export") ? <button onClick={exportExcel} className="premium-button premium-button-soft"><Download size={17} /> Export</button> : null}
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat label="To‘lovlar" value={`${num(payments.length)} ta`} />
        <Stat label="Jami USD" value={money(totalUSD, "USD")} />
        <Stat label="Jami UZS" value={money(totalUZS, "UZS")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex h-12 max-w-[420px] items-center gap-3 rounded-[18px] border border-[#dfe8f3] bg-white px-4">
          <Search size={18} className="text-[#8aa0ba]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mijoz yoki izoh..." className="flex-1 bg-transparent text-[14px] outline-none" />
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th>
                <th className="p-4 font-normal">Summa</th>
                <th className="p-4 font-normal">Method</th>
                <th className="p-4 font-normal">Sana</th>
                <th className="p-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">{payment.debt?.client?.fullName || "—"}</td>
                  <td className="p-4">{money(payment.amount, payment.currency)}</td>
                  <td className="p-4 text-[#64748b]">{payment.method || "—"}</td>
                  <td className="p-4 text-[#64748b]">{dateText(payment.createdAt)}</td>
                  <td className="p-4 text-right"><button onClick={() => removePayment(payment.id)} className="text-[13px] text-red-600">O‘chirish</button></td>
                </tr>
              ))}
              {!filtered.length ? <tr><td colSpan={5} className="p-10 text-center text-[#8aa0ba]">To‘lov yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/35 backdrop-blur-[4px]">
          <div className="absolute left-1/2 top-1/2 w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-[#e7edf5] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-7 py-5">
              <div><h2 className="text-[28px] font-normal tracking-[-0.05em]">To‘lov qo‘shish</h2><p className="mt-1 text-[13px] text-[#8aa0ba]">Qarz bo‘yicha qisman yoki to‘liq to‘lov.</p></div>
              <button onClick={() => setModal(false)} className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f5f7fa]"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-7 py-6">
              <Label label="Qarz"><CustomSelect value={form.debtId} onChange={(value) => {
                const debt = debts.find((d) => d.id === value);
                setForm({ ...form, debtId: value, currency: debt?.currency || form.currency });
              }} options={debtOptions} /></Label>
              <Input label="Summa" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
              <Label label="Valyuta"><CustomSelect value={form.currency} onChange={(value) => setForm({ ...form, currency: value })} options={[{ value: "UZS", label: "UZS" }, { value: "USD", label: "USD" }]} /></Label>
              <Label label="Method"><CustomSelect value={form.method} onChange={(value) => setForm({ ...form, method: value })} options={[{ value: "CASH", label: "Naqd" }, { value: "CARD", label: "Karta" }, { value: "TRANSFER", label: "Transfer" }]} /></Label>
              <div className="col-span-2"><Input label="Izoh" value={form.comment} onChange={(value) => setForm({ ...form, comment: value })} /></div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#edf2f7] px-7 py-5">
              <button onClick={() => setModal(false)} className="premium-button premium-button-soft">Bekor</button>
              <button onClick={savePayment} className="premium-button premium-button-primary">Saqlash</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-6"><p className="text-[13px] text-[#64748b]">{label}</p><p className="mt-5 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="premium-label">{label}</span>{children}</label>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="premium-label">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="premium-input" /></label>;
}
