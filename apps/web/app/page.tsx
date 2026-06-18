"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "./components/AppLayout";
import { apiJson, money, num } from "./lib/api";

type Dashboard = {
  clientsCount?: number;
  debtsCount?: number;
  paymentsCount?: number;
  totalDebtsUZS?: number;
  totalDebtsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  remainingUZS?: number;
  remainingUSD?: number;
  todayPayments?: number;
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  activeDebts?: number;
  closedDebts?: number;
  overdueDebts?: number;
  topDebtors?: { id?: string; fullName?: string; clientName?: string; phone?: string; total?: number; remaining?: number; currency?: string }[];
};

const empty: Dashboard = {
  clientsCount: 0,
  debtsCount: 0,
  paymentsCount: 0,
  totalDebtsUZS: 0,
  totalDebtsUSD: 0,
  totalPaidUZS: 0,
  totalPaidUSD: 0,
  remainingUZS: 0,
  remainingUSD: 0,
  todayPayments: 0,
  todayPaymentsUZS: 0,
  todayPaymentsUSD: 0,
  activeDebts: 0,
  closedDebts: 0,
  overdueDebts: 0,
  topDebtors: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard>(empty);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await apiJson<Dashboard>("/dashboard");
      setData({ ...empty, ...(result || {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dashboard yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const health = useMemo(() => {
    const overdue = Number(data.overdueDebts || 0);
    const active = Number(data.activeDebts || 0) || 1;
    const riskPenalty = Math.min(35, Math.round((overdue / active) * 100));
    const debtPenalty = Number(data.remainingUSD || 0) > 0 || Number(data.remainingUZS || 0) > 0 ? 8 : 0;
    return Math.max(55, 96 - riskPenalty - debtPenalty);
  }, [data]);

  const topDebtors = (data.topDebtors || []).slice(0, 6);

  return (
    <AppLayout title="Dashboard" subtitle="Qanot biznes egasiga asosiy holatni bitta ekranda ko‘rsatadi.">
      {error ? <ErrorBox text={error} /> : null}

      <div className="grid grid-cols-[1.25fr_0.75fr] gap-5 max-xl:grid-cols-1">
        <section className="premium-card p-5">
          <div className="flex items-start justify-between gap-4 max-md:block">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Owner OS</p>
              <h2 className="mt-2 text-[30px] font-medium tracking-[-0.06em] text-[var(--text)]">
                Bugungi boshqaruv markazi
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
                Pul, qarz, to‘lov va risklar alohida sahifalarga tarqalib ketmaydi.
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft)] px-5 py-4 text-right max-md:mt-4 max-md:text-left">
              <p className="text-[12px] text-[var(--muted)]">Business Health</p>
              <p className="mt-1 text-[34px] font-semibold tracking-[-0.06em] text-[var(--text)]">{health}%</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <Stat label="Mijozlar" value={num(data.clientsCount || 0)} />
            <Stat label="Qarzdorlar" value={num(data.debtsCount || 0)} />
            <Stat label="To‘lovlar" value={num(data.paymentsCount || 0)} />
            <Stat label="Bugungi to‘lov" value={money(data.todayPaymentsUZS ?? data.todayPayments, "UZS")} />
          </div>
        </section>

        <section className="premium-card p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Risk Center</p>
          <h2 className="mt-2 text-[24px] font-medium tracking-[-0.05em]">Nimani tekshirish kerak?</h2>
          <div className="mt-4 space-y-2">
            <Risk label="Aktiv qarzlar" value={`${num(data.activeDebts || 0)} ta`} />
            <Risk label="Muddati o‘tgan" value={`${num(data.overdueDebts || 0)} ta`} danger={Boolean(data.overdueDebts)} />
            <Risk label="Yopilgan qarzlar" value={`${num(data.closedDebts || 0)} ta`} />
          </div>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        <Panel title="UZS qarz balansi" href="/debts">
          <Metric label="Jami qarz" value={money(data.totalDebtsUZS, "UZS")} />
          <Metric label="To‘langan" value={money(data.totalPaidUZS, "UZS")} />
          <Metric label="Qoldiq" value={money(data.remainingUZS, "UZS")} strong />
        </Panel>

        <Panel title="USD qarz balansi" href="/debts">
          <Metric label="Jami qarz" value={money(data.totalDebtsUSD, "USD")} />
          <Metric label="To‘langan" value={money(data.totalPaidUSD, "USD")} />
          <Metric label="Qoldiq" value={money(data.remainingUSD, "USD")} strong />
        </Panel>

        <Panel title="Tezkor kirish">
          <Quick href="/finance" title="Moliya" text="Kassa, bank, kirim-chiqim" />
          <Quick href="/sklad" title="Sklad" text="Tovar, ombor, qoldiq" />
          <Quick href="/reports" title="Hisobot" text="Grafik, profit, tahlil" />
        </Panel>
      </div>

      <div className="premium-card mt-5 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[23px] font-medium tracking-[-0.05em]">Top qarzdorlar</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Eng katta qoldiqlar birinchi ko‘rinadi.</p>
          </div>
          <Link href="/debts" className="rounded-[14px] bg-[var(--soft)] px-4 py-2 text-[12px] text-[var(--muted)] hover:text-[var(--text)]">
            Hammasi
          </Link>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[var(--soft)] text-[10px] uppercase tracking-[0.14em] text-[var(--muted-2)]">
              <tr>
                <th className="px-4 py-3 font-normal">Mijoz</th>
                <th className="px-4 py-3 font-normal">Telefon</th>
                <th className="px-4 py-3 text-right font-normal">Qarz</th>
              </tr>
            </thead>
            <tbody>
              {topDebtors.map((item, index) => (
                <tr key={item.id || index} className="border-t border-[var(--line-soft)]">
                  <td className="px-4 py-3 text-[var(--text)]">{item.fullName || item.clientName || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{item.phone || "—"}</td>
                  <td className="px-4 py-3 text-right text-[var(--text)]">{money(item.total ?? item.remaining, item.currency || "UZS")}</td>
                </tr>
              ))}
              {!topDebtors.length ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-[var(--muted-2)]">Top qarzdor yo‘q</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mb-5 rounded-[18px] border border-[var(--danger-line)] bg-[var(--danger-bg)] px-5 py-4 text-[13px] text-[var(--danger-text)]">{text}</div>;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 text-[22px] font-medium tracking-[-0.05em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[21px] font-medium tracking-[-0.05em]">{title}</h2>
        {href ? <Link href={href} className="text-[12px] text-[var(--blue)]">Ochish</Link> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[15px] bg-[var(--soft)] px-4 py-3">
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
      <span className={`text-[14px] ${strong ? "font-semibold text-[var(--text)]" : "text-[var(--text)]"}`}>{value}</span>
    </div>
  );
}

function Risk({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[15px] bg-[var(--soft)] px-4 py-3">
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
      <span className={danger ? "text-[13px] font-semibold text-[var(--danger-text)]" : "text-[13px] text-[var(--text)]"}>{value}</span>
    </div>
  );
}

function Quick({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-[15px] bg-[var(--soft)] px-4 py-3 transition hover:bg-[var(--hover)]">
      <p className="text-[14px] font-medium text-[var(--text)]">{title}</p>
      <p className="mt-0.5 text-[12px] text-[var(--muted)]">{text}</p>
    </Link>
  );
}
