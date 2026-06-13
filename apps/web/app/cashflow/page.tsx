"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, dateText } from "../lib/api";

type Cashflow = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category?: string | null;
  method?: string | null;
  description?: string | null;
  createdAt: string;
};

export default function CashflowPage() {
  const [items, setItems] = useState<Cashflow[]>([]);
  const [type, setType] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("CASH");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiJson<Cashflow[]>("/cashflow");
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "DDS yuklanmadi");
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    try {
      await apiJson("/cashflow", {
        method: "POST",
        body: JSON.stringify({ type, amount: Number(amount || 0), currency, category, method, description }),
      });
      setAmount("");
      setCategory("");
      setDescription("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "DDS saqlanmadi");
    }
  }

  return (
    <AppLayout title="DDS / Cashflow" subtitle="Kirim-chiqim, kategoriya, metod va tarix.">
      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-red-600">{error}</div> : null}

      <div className="premium-card mb-5 p-6">
        <h2 className="text-[22px] font-normal tracking-[-0.04em]">Yangi cashflow</h2>
        <div className="mt-5 grid grid-cols-6 gap-4">
          <Select label="Type" value={type} onChange={setType} options={["INCOME", "EXPENSE"]} />
          <Input label="Amount" value={amount} onChange={setAmount} />
          <Select label="Currency" value={currency} onChange={setCurrency} options={["UZS", "USD"]} />
          <Input label="Category" value={category} onChange={setCategory} />
          <Select label="Method" value={method} onChange={setMethod} options={["CASH", "CARD", "TRANSFER"]} />
          <div className="flex items-end"><button onClick={create} className="premium-button premium-button-primary w-full">Saqlash</button></div>
        </div>
        <div className="mt-4">
          <Input label="Description" value={description} onChange={setDescription} />
        </div>
      </div>

      <div className="premium-card p-6">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.12em] text-[#8aa0ba]">
            <tr>
              <th className="p-4 font-normal">Sana</th>
              <th className="p-4 font-normal">Type</th>
              <th className="p-4 font-normal">Category</th>
              <th className="p-4 font-normal">Method</th>
              <th className="p-4 font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[#edf2f7]">
                <td className="p-4 text-[#64748b]">{dateText(item.createdAt)}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4 text-[#64748b]">{item.category || "—"}</td>
                <td className="p-4 text-[#64748b]">{item.method || "—"}</td>
                <td className="p-4">{money(item.amount, item.currency)}</td>
              </tr>
            ))}
            {!items.length ? <tr><td colSpan={5} className="p-8 text-center text-[#8aa0ba]">Cashflow yo‘q</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="premium-label">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="premium-input" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span className="premium-label">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="premium-input">{options.map((o) => <option key={o}>{o}</option>)}</select></label>;
}
