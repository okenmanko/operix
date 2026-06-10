"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { apiJson } from "../lib/api";

type CashflowItem = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  currency: string;
  category?: string | null;
  method?: string | null;
  description?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

type Summary = {
  income: number;
  expense: number;
  transfer: number;
  balance: number;
  recent: CashflowItem[];
};

const typeLabels: Record<string, string> = {
  INCOME: "Kirim",
  EXPENSE: "Chiqim",
  TRANSFER: "Transfer",
};

const typeStyles: Record<string, string> = {
  INCOME: "bg-emerald-50 text-emerald-600",
  EXPENSE: "bg-red-50 text-red-600",
  TRANSFER: "bg-sky-50 text-sky-600",
};

function money(value: number, currency = "UZS") {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${currency}`;
}

export default function CashflowPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<CashflowItem[]>([]);
  const [editing, setEditing] = useState<CashflowItem | null>(null);

  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("INCOME");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("Naqd");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const [s, list] = await Promise.all([
      apiJson<Summary>("/cashflow/summary"),
      apiJson<CashflowItem[]>("/cashflow"),
    ]);

    setSummary(s);
    setItems(Array.isArray(list) ? list : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.type, item.category, item.method, item.description, item.amount]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  function reset() {
    setEditing(null);
    setType("INCOME");
    setAmount("");
    setCategory("");
    setMethod("Naqd");
    setDescription("");
  }

  function startEdit(item: CashflowItem) {
    setEditing(item);
    setType(item.type);
    setAmount(String(item.amount || ""));
    setCategory(item.category || "");
    setMethod(item.method || "");
    setDescription(item.description || "");
  }

  async function save() {
    if (!amount || Number(amount) <= 0) return;

    const payload = {
      type,
      amount: Number(amount),
      currency: "UZS",
      category: category.trim() || null,
      method: method.trim() || null,
      description: description.trim() || null,
    };

    if (editing) {
      await apiJson(`/cashflow/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiJson("/cashflow", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Operatsiyani o‘chiramizmi?")) return;
    await apiJson(`/cashflow/${id}`, { method: "DELETE" });
    await load();
  }

  const stats = [
    { label: "Kirim", value: summary?.income || 0, tone: "text-emerald-600" },
    { label: "Chiqim", value: summary?.expense || 0, tone: "text-red-600" },
    { label: "Transfer", value: summary?.transfer || 0, tone: "text-sky-600" },
    { label: "Balans", value: summary?.balance || 0, tone: "text-slate-950" },
  ];

  return (
    <AppLayout title="DDS" subtitle="Pul harakati: kirim, chiqim, kassa, bank va xarajatlar">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <p className="text-[13px] font-semibold text-slate-500">{item.label}</p>
            <p className={`mt-8 text-[26px] font-semibold tracking-[-0.05em] ${item.tone}`}>
              {money(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[430px_1fr] gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">
              {editing ? "Operatsiyani tahrirlash" : "Yangi operatsiya"}
            </h2>

            {editing && (
              <button onClick={reset} className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-bold text-slate-500">
                Bekor
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="INCOME">Kirim</option>
              <option value="EXPENSE">Chiqim</option>
              <option value="TRANSFER">Transfer</option>
            </select>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Summa"
              inputMode="numeric"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategoriya: savdo, oylik, ijara, transport..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="Naqd">Naqd</option>
              <option value="Karta">Karta</option>
              <option value="Bank">Bank</option>
              <option value="Click">Click</option>
              <option value="Payme">Payme</option>
              <option value="Terminal">Terminal</option>
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Izoh"
              className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <button
              onClick={save}
              className="h-12 w-full rounded-2xl bg-sky-500 text-[14px] font-bold text-white transition hover:bg-sky-600"
            >
              {editing ? "Saqlash" : "Qo‘shish"}
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Pul harakati</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="h-10 w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[100px_1fr_150px_150px_120px] bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
              <div>Type</div>
              <div>Izoh</div>
              <div>Usul</div>
              <div className="text-right">Summa</div>
              <div className="text-right">Action</div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-[14px] font-semibold text-slate-400">Ma’lumot yo‘q</div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="grid grid-cols-[100px_1fr_150px_150px_120px] items-center border-t border-slate-100 px-4 py-4">
                  <div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${typeStyles[item.type] || "bg-slate-100 text-slate-500"}`}>
                      {typeLabels[item.type] || item.type}
                    </span>
                  </div>

                  <div>
                    <p className="text-[14px] font-bold text-slate-950">{item.category || "-"}</p>
                    <p className="mt-1 text-[12px] font-medium text-slate-400">{item.description || "-"}</p>
                  </div>

                  <div className="text-[13px] font-semibold text-slate-500">{item.method || "-"}</div>

                  <div className={`text-right text-[14px] font-bold ${item.type === "EXPENSE" ? "text-red-600" : "text-slate-950"}`}>
                    {money(item.amount, item.currency)}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(item)} className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-bold text-slate-600">
                      Edit
                    </button>
                    <button onClick={() => remove(item.id)} className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">
                      Del
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
