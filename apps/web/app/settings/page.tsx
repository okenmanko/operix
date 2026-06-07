"use client";

import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";

type Company = {
  id: string;
  name: string;
  phone?: string;
  usdRate: number;
};

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [usdRate, setUsdRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);

    const res = await fetch(`http://localhost:4000/companies/${user.companyId}`);
    const data = await res.json();

    setCompany(data);
    setName(data.name || "");
    setPhone(data.phone || "");
    setUsdRate(String(data.usdRate || 12200));
  }

  async function saveSettings() {
    if (!company) return;

    setLoading(true);
    setSaved(false);

    await fetch(`http://localhost:4000/companies/${company.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        usdRate: Number(usdRate),
      }),
    });

    setLoading(false);
    setSaved(true);
    await loadCompany();

    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppLayout title="Sozlamalar" subtitle="Kompaniya va valyuta sozlamalari">
      <div className="max-w-2xl rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[20px] font-semibold text-slate-950">
          Kompaniya sozlamalari
        </h2>

        <p className="mt-1 text-[13px] font-medium text-slate-400">
          Bu sozlamalar dashboard va hisob-kitoblarga ta’sir qiladi
        </p>

        <div className="mt-6 space-y-4">
          <Field label="Kompaniya nomi">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6]"
            />
          </Field>

          <Field label="Kompaniya telefoni">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6]"
            />
          </Field>

          <Field label="USD kursi">
            <input
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value.replace(/\D/g, ""))}
              placeholder="12200"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6]"
            />
            <p className="mt-2 text-[12px] font-medium text-slate-400">
              Masalan: 1 USD = {Number(usdRate || 0).toLocaleString("ru-RU")} UZS
            </p>
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[13px] font-medium text-slate-400">
            {saved ? "Sozlamalar saqlandi" : "O‘zgarishlardan keyin saqlang"}
          </p>

          <button
            type="button"
            onClick={saveSettings}
            disabled={loading}
            className="rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-[13px] font-semibold text-slate-600">{label}</p>
      {children}
    </label>
  );
}