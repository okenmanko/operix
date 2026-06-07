"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../components/AppLayout";

const COMPANY_ID = "cmq2dnifq000037ukftp1b9o4";

type Payment = {
  id: string;
  amount: number;
  currency: string;
};

type Debt = {
  id: string;
  amount: number;
  currency: string;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  payments: Payment[];
};

type Client = {
  id: string;
  fullName: string;
  phone: string;
  address?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  debts: Debt[];
};

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  const [showClientModal, setShowClientModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");

  async function loadClients() {
    const res = await fetch("http://localhost:4000/clients");
    const data = await res.json();
    setClients(data);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function createClient() {
    if (!fullName || !phone) return;

    await fetch("http://localhost:4000/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        phone,
        address: address || undefined,
        guarantorName: guarantorName || undefined,
        guarantorPhone: guarantorPhone || undefined,
        companyId: COMPANY_ID,
      }),
    });

    setShowClientModal(false);
    setFullName("");
    setPhone("");
    setAddress("");
    setGuarantorName("");
    setGuarantorPhone("");

    await loadClients();
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const q = search.toLowerCase();

      return (
        client.fullName.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.address || "").toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  function getClientRemaining(client: Client) {
    return client.debts.reduce((sum, debt) => {
      const paid = debt.payments.reduce(
        (s, payment) => s + Number(payment.amount),
        0,
      );

      return sum + (Number(debt.amount) - paid);
    }, 0);
  }

  function getClientStatus(client: Client) {
    const remaining = getClientRemaining(client);

    if (client.debts.length === 0) return "NO DEBT";
    if (remaining <= 0) return "CLOSED";
    return "ACTIVE";
  }

  return (
    <AppLayout title="Mijozlar" subtitle="Mijozlar va qarzdorlar bazasi">
      <div className="mb-5 flex items-center justify-between gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism, telefon yoki manzil bo‘yicha qidirish..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowClientModal(true)}
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Yangi mijoz
        </button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[18px] font-semibold text-slate-950">
            Mijozlar ro‘yxati
          </h2>
          <p className="mt-1 text-[13px] font-medium text-slate-400">
            Jami: {filteredClients.length} ta mijoz
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredClients.map((client) => {
            const remaining = getClientRemaining(client);
            const status = getClientStatus(client);

            return (
              <button
                key={client.id}
                type="button"
                onClick={() => router.push(`/clients/${client.id}`)}
                className="grid w-full grid-cols-5 items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="col-span-2">
                  <p className="text-[15px] font-semibold text-slate-950">
                    {client.fullName}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    ID: {client.id.slice(0, 10)}
                  </p>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-slate-500">
                    {client.phone}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    {client.address || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[13px] font-semibold text-[#FF6B00]">
                    {remaining.toLocaleString("ru-RU")} UZS
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-400">
                    Qoldiq
                  </p>
                </div>

                <div className="flex justify-end">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                    {status}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="p-6 text-sm font-medium text-slate-400">
              Mijoz topilmadi
            </div>
          )}
        </div>
      </div>

      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl">
            <h2 className="text-[20px] font-semibold text-slate-950">
              Yangi mijoz qo‘shish
            </h2>

            <p className="mt-1 text-[13px] font-medium text-slate-400">
              Mijoz ma’lumotlarini kiriting
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism Familiya"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzil"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <input
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                placeholder="Kafil ismi"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />

              <input
                value={guarantorPhone}
                onChange={(e) => setGuarantorPhone(e.target.value)}
                placeholder="Kafil telefoni"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={createClient}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}