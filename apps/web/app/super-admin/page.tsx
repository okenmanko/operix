"use client";

import { useEffect, useState } from "react";
import SuperAdminLayout from "../components/SuperAdminLayout";
import { apiJson, money } from "../lib/api";

type Summary = {
  companies: number;
  active: number;
  trial: number;
  blocked: number;
  users: number;
};

export default function SuperAdminPage() {
  const [summary, setSummary] = useState<Summary>({
    companies: 0,
    active: 0,
    trial: 0,
    blocked: 0,
    users: 0,
  });
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await apiJson<Summary>("/super-admin/summary");
      setSummary(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black">Super Admin</h1>
          <p className="mt-3 text-base font-semibold text-slate-500">
            Kompaniyalar, userlar, tariflar va SaaS nazorati
          </p>
        </div>
        <a
          href="/super-admin/companies"
          className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white"
        >
          Kompaniya qo‘shish
        </a>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        <Card label="Kompaniyalar" value={summary.companies} />
        <Card label="Active" value={summary.active} />
        <Card label="Trial" value={summary.trial} />
        <Card label="Blocked" value={summary.blocked} />
        <Card label="Userlar" value={summary.users} />
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black">Keyingi qadam</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          Kompaniya yaratish, unga tarif berish, modul va limitlarni boshqarish
          tayyor. User Management orqali kompaniya ichida OWNER, MANAGER,
          CASHIER, HR rollarini boshqarish mumkin.
        </p>
      </div>
    </SuperAdminLayout>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-5 text-4xl font-black">{money(value)}</p>
    </div>
  );
}
