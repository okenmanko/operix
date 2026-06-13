"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ActionBar from "../components/ui/ActionBar";
import CustomSelect from "../components/ui/CustomSelect";
import { apiJson, dateText, downloadFile, money, num } from "../lib/api";
import { can } from "../lib/permissions";

type Client = { id: string; fullName: string; phone?: string | null };
type Debt = { id: string; clientId?: string; client?: Client; amount: number; currency: string; remainingAmount?: number; status?: string };
type Payment = { id: string; amount: number; currency: string; method?: string | null; comment?: string | null; createdAt?: string; debt?: Debt; client?: Client };

const blank = {
  debtId: "",
  amount: "",
  currency: "UZS",
  method: "CASH",
  comment: "",
};

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
      if (!form.debtId && activeDebts[0]?.id) setForm((current) => ({...current, debtId: activeDebts[0].id, currency: activeDebts[0].currency || "UZS"}));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lovlar yuklanmadi");
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return payments.filter((payment) =>
      (payment.debt?.client?.fullName || payment.client?.fullName || "").toLowerCase().includes(q) ||
      (payment.debt?.client?.phone || payment.client?.phone || "").includes(query) ||
      (payment.comment || "").toLowerCase().includes(q)
    );
  }, [payments, query]);

  const totals = useMemo(() => {
    const today = new Date().toDateString();
    return {
      count: payments.length,
      today: payments.filter((payment) => payment.createdAt && new Date(payment.createdAt).toDateString() === today).reduce((sum, payment) => sum + Number(payment.currency === "UZS" ? payment.amount : 0), 0),
      uzs: payments.filter((payment) => payment.currency === "UZS").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      usd: payments.filter((payment) => payment.currency === "USD").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
  }, [payments]);

  async function createPayment() {
    try {
      setError("");
      await apiJson("/payments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount || 0),
        }),
      });
      setModal(false);
      setForm({...blank, debtId: debts[0]?.id || ""});
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To‘lov qo‘shilmadi");
    }
  }

  async function exportPayments() {
    await downloadFile("/payments/export-excel", "operix-payments.xlsx");
  }

  const debtOptions = debts.map((debt) => ({ value: debt.id, label: `${debt.client?.fullName || "Mijoz"} • ${money(debt.remainingAmount ?? debt.amount, debt.currency)}` }));

  return (
    <AppLayout title="To‘lovlar" subtitle="Qarz to‘lovlari, kunlik yig‘im va hisobot.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}

      <ActionBar
        title="To‘lov amallari"
        subtitle="To‘lov qo‘shish va Excel export."
        items={[
          { label: "To‘lov qo‘shish", icon: <Plus size={17} />, action: "payments:create", onClick: () => setModal(true) },
          { label: "Excel export", icon: <Download size={17} />, action: "payments:export", onClick: exportPayments, variant: "soft" },
        ]}
      />

      <div className="mb-5 grid grid-cols-4 gap-4">
        <Stat label="Jami to‘lovlar" value={`${num(totals.count)} ta`} />
        <Stat label="Bugungi UZS" value={money(totals.today, "UZS")} />
        <Stat label="Jami UZS" value={money(totals.uzs, "UZS")} />
        <Stat label="Jami USD" value={money(totals.usd, "USD")} />
      </div>

      <div className="premium-card p-6">
        <div className="mb-5 flex h-12 max-w-[420px] items-center gap-3 rounded-[18px] border border-[#dfe8f3] bg-white px-4">
          <Search size={18} className="text-[#8aa0ba]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mijoz, telefon yoki izoh..." className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a6b4c7]" />
          {query ? <button onClick={() => setQuery("")}><X size={16} className="text-[#8aa0ba]" /></button> : null}
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Mijoz</th>
                <th className="p-4 font-normal">Summa</th>
                <th className="p-4 font-normal">Method</th>
                <th className="p-4 font-normal">Izoh</th>
                <th className="p-4 text-right font-normal">Sana</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-t border-[#edf2f7]">
                  <td className="p-4">{payment.debt?.client?.fullName || payment.client?.fullName || "—"}</td>
                  <td className="p-4">{money(payment.amount, payment.currency)}</td>
                  <td className="p-4 text-[#64748b]">{payment.method || "—"}</td>
                  <td className="p-4 text-[#64748b]">{payment.comment || "—"}</td>
                  <td className="p-4 text-right text-[#64748b]">{dateText(payment.createdAt)}</td>
                </tr>
              ))}
              {!filtered.length ? <tr><td colSpan={5} className="p-10 text-center text-[#8aa0ba]">To‘lov topilmadi</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal && can("payments:create") ? (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/35 backdrop-blur-[4px]">
          <div className="absolute left-1/2 top-1/2 w-[720px] -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-[32px] border border-[#e7edf5] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-7 py-5">
              <div><h2 className="text-[28px] font-normal tracking-[-0.05em]">To‘lov qo‘shish</h2><p className="mt-1 text-[13px] text-[#8aa0ba]">Qarz bo‘yicha to‘lov kiriting.</p></div>
              <button onClick={() => setModal(false)} className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f5f7fa] text-[#64748b]"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-7 py-6">
              <Label label="Qarz"><CustomSelect value={form.debtId} onChange={(value) => {
                const debt = debts.find((item) => item.id === value);
                setForm({...form, debtId: value, currency: debt?.currency || form.currency});
              }} options={debtOptions} /></Label>
              <Input label="Summa" value={form.amount} onChange={(value) => setForm({...form, amount: value})} />
              <Label label="Valyuta"><CustomSelect value={form.currency} onChange={(value) => setForm({...form, currency: value})} options={[{value:"UZS", label:"UZS"}, {value:"USD", label:"USD"}]} /></Label>
              <Label label="Method"><CustomSelect value={form.method} onChange={(value) => setForm({...form, method: value})} options={[{value:"CASH", label:"Naqd"}, {value:"CARD", label:"Karta"}, {value:"TRANSFER", label:"Transfer"}]} /></Label>
              <div className="col-span-2"><Input label="Izoh" value={form.comment} onChange={(value) => setForm({...form, comment: value})} /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#edf2f7] px-7 py-5">
              <button onClick={() => setModal(false)} className="premium-button premium-button-soft">Bekor</button>
              <button onClick={createPayment} className="premium-button premium-button-primary">Saqlash</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-6"><p className="text-[13px] font-normal text-[#64748b]">{label}</p><p className="mt-5 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="premium-label">{label}</span>{children}</label>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="premium-label">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input" /></label>;
}
