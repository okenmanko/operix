"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Clock3, Lock, Plus, Users } from "lucide-react";
import { apiJson, num } from "../lib/api";
import {
  Button,
  Card,
  Company,
  PageTop,
  StatusBadge,
  SuperAdminShell,
  Toast,
  User,
} from "./_components";

export default function Page() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [companyData, userData] = await Promise.all([
        apiJson<Company[]>("/super-admin/companies"),
        apiJson<User[]>("/super-admin/users"),
      ]);
      setCompanies(Array.isArray(companyData) ? companyData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Super admin yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(
    () => ({
      companies: companies.length,
      active: companies.filter((item) => item.status === "ACTIVE").length,
      trial: companies.filter((item) => item.status === "TRIAL").length,
      blocked: companies.filter((item) => item.status === "BLOCKED").length,
      users: users.length,
    }),
    [companies, users],
  );

  return (
    <SuperAdminShell>
      <PageTop
        title="Super Admin"
        subtitle="Kompaniyalar, userlar, tariflar va SaaS nazorati. Minimal, tez va aniq."
        action={
          <Link href="/super-admin/companies">
            <Button>
              <span className="inline-flex items-center gap-2">
                <Plus size={16} /> Kompaniya qo‘shish
              </span>
            </Button>
          </Link>
        }
      />

      {error ? <Toast>{error}</Toast> : null}

      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        <Stat icon={<Building2 size={18} />} label="Kompaniya" value={summary.companies} />
        <Stat icon={<CheckCircle2 size={18} />} label="Active" value={summary.active} />
        <Stat icon={<Clock3 size={18} />} label="Trial" value={summary.trial} />
        <Stat icon={<Lock size={18} />} label="Blocked" value={summary.blocked} />
        <Stat icon={<Users size={18} />} label="User" value={summary.users} />
      </div>

      <div className="mt-5 grid grid-cols-[1.2fr_0.8fr] gap-5 max-xl:grid-cols-1">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-normal tracking-[-0.045em] text-[var(--text)]">Kompaniyalar</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Oxirgi kompaniyalar va tarif holati.</p>
            </div>
            <Link href="/super-admin/companies">
              <Button variant="soft">Hammasi</Button>
            </Link>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[var(--line)]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--soft)] text-[10px] uppercase tracking-[0.14em] text-[var(--muted-2)]">
                <tr>
                  <th className="p-3 font-normal">Kompaniya</th>
                  <th className="p-3 font-normal">Plan</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 text-right font-normal">Modul</th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 8).map((company) => (
                  <tr key={company.id} className="border-t border-[var(--line)]">
                    <td className="p-3 text-[var(--text)]">{company.name}</td>
                    <td className="p-3 text-[var(--muted)]">{company.subscriptionPlan}</td>
                    <td className="p-3"><StatusBadge status={company.status} /></td>
                    <td className="p-3 text-right text-[var(--muted)]">{company.enabledModules?.length || 0}</td>
                  </tr>
                ))}
                {!companies.length ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--muted)]">Kompaniya yo‘q</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[22px] font-normal tracking-[-0.045em] text-[var(--text)]">Health</h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">Kompaniya holati tezkor bahosi.</p>
          <div className="mt-5 space-y-3">
            {companies.slice(0, 6).map((company) => {
              const score = Math.min(
                100,
                Math.max(
                  10,
                  (company.status === "ACTIVE" ? 45 : company.status === "TRIAL" ? 25 : 5) +
                    (company.enabledModules?.length || 0) * 3 +
                    (company.subscriptionPlan === "PRO" ? 20 : company.subscriptionPlan === "BUSINESS" ? 12 : 5),
                ),
              );
              return <Health key={company.id} name={company.name} score={score} />;
            })}
            {!companies.length ? <p className="text-[13px] text-[var(--muted)]">Ma’lumot yo‘q</p> : null}
          </div>
        </Card>
      </div>
    </SuperAdminShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[var(--blue-soft)] text-[var(--blue)]">
        {icon}
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 text-[30px] font-normal tracking-[-0.06em] text-[var(--text)]">
        {num(value)} <span className="text-[13px] text-[var(--muted)]">ta</span>
      </p>
    </Card>
  );
}

function Health({ name, score }: { name: string; score: number }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft)] p-4">
      <div className="flex justify-between gap-3 text-[13px] text-[var(--text)]">
        <span className="line-clamp-1">{name}</span>
        <span>{score}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--card)]">
        <div className="h-full rounded-full bg-[var(--blue)]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
