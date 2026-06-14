"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, Phone, User } from "lucide-react";
import Link from "next/link";
import AppLayout from "../../components/AppLayout";
import { apiJson, dateText, money, num } from "../../lib/api";

type Client = {
  id: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  guarantorName?: string | null;
  guarantorPhone?: string | null;
};

type Debt = {
  id: string;
  amount: number;
  currency: "USD" | "UZS";
  status: string;
  dueDate?: string | null;
  comment?: string | null;
  client?: Client;
  payments?: Array<{ id: string; amount: number; currency: "USD" | "UZS"; createdAt?: string }>;
};

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [clientsData, debtsData] = await Promise.all([
        apiJson<Client[]>("/clients"),
        apiJson<Debt[]>("/debts"),
      ]);

      const found = clientsData.find((item) => item.id === params.id) || null;
      setClient(found);
      setDebts(debtsData.filter((debt) => debt.client?.id === params.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mijoz yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const totals = useMemo(() => {
    const usd = debts.filter((d) => d.currency === "USD").reduce((s, d) => s + Number(d.amount || 0), 0);
    const uzs = debts.filter((d) => d.currency === "UZS").reduce((s, d) => s + Number(d.amount || 0), 0);
    const payments = debts.flatMap((d) => d.payments || []);
    const paidUsd = payments.filter((p) => p.currency === "USD").reduce((s, p) => s + Number(p.amount || 0), 0);
    const paidUzs = payments.filter((p) => p.currency === "UZS").reduce((s, p) => s + Number(p.amount || 0), 0);

    return { usd, uzs, paidUsd, paidUzs };
  }, [debts]);

  return (
    <AppLayout title="Mijoz kartasi" subtitle="Qarzlar, to‘lovlar va mijoz ma’lumotlari.">
      <Link href="/clients" className="mb-5 inline-flex items-center gap-2 text-[14px] text-[#64748b] hover:text-[#315efb]">
        <ArrowLeft size={17} /> Mijozlarga qaytish
      </Link>

      {error ? <div className="mb-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{error}</div> : null}

      <div className="grid grid-cols-[0.9fr_1.4fr] gap-5">
        <div className="premium-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#eef4ff] text-[#315efb]">
              <User size={26} />
            </div>
            <div>
              <h2 className="text-[28px] font-normal tracking-[-0.05em] text-[#111827]">{client?.fullName || "—"}</h2>
              <p className="mt-1 text-[14px] text-[#8aa0ba]">{client?.phone || "Telefon yo‘q"}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-[14px]">
            <Info label="Manzil" value={client?.address || "—"} />
            <Info label="Kafil" value={client?.guarantorName || "—"} />
            <Info label="Kafil telefoni" value={client?.guarantorPhone || "—"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Jami USD" value={money(totals.usd, "USD")} />
          <Stat label="Jami UZS" value={money(totals.uzs, "UZS")} />
          <Stat label="To‘langan USD" value={money(totals.paidUsd, "USD")} />
          <Stat label="To‘langan UZS" value={money(totals.paidUzs, "UZS")} />
        </div>
      </div>

      <div className="premium-card mt-5 p-6">
        <h2 className="mb-5 text-[24px] font-normal tracking-[-0.04em]">Qarzlar</h2>
        <div className="overflow-hidden rounded-[22px] border border-[#edf2f7]">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.14em] text-[#8aa0ba]">
              <tr>
                <th className="p-4 font-normal">Summa</th>
                <th className="p-4 font-normal">Muddat</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Izoh</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-t border-[#edf2f7]">
                  <td className="p-4 text-[#111827]">{money(debt.amount, debt.currency)}</td>
                  <td className="p-4 text-[#64748b]">{dateText(debt.dueDate)}</td>
                  <td className="p-4"><span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[12px] text-[#315efb]">{debt.status}</span></td>
                  <td className="p-4 text-[#64748b]">{debt.comment || "—"}</td>
                </tr>
              ))}
              {!debts.length ? <tr><td colSpan={4} className="p-10 text-center text-[#8aa0ba]">Qarz yo‘q</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="premium-card p-6"><p className="text-[13px] text-[#64748b]">{label}</p><p className="mt-5 text-[26px] font-normal tracking-[-0.05em] text-[#111827]">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] px-4 py-3"><span className="text-[#8aa0ba]">{label}</span><span className="text-[#111827]">{value}</span></div>;
}
