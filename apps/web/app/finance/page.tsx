"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Banknote, CreditCard, Download, FileSpreadsheet, RefreshCw, Wallet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Dashboard = {
  todayPaymentsUZS?: number;
  todayPaymentsUSD?: number;
  totalPaidUZS?: number;
  totalPaidUSD?: number;
  paymentsCount?: number;
  remainingUZS?: number;
  remainingUSD?: number;
};

export default function FinancePage() {
  const [data, setData] = useState<Dashboard>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setData(await apiJson<Dashboard>("/dashboard"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Moliya yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Moliya" subtitle="Buxgalter uchun kassa, bank, to‘lov va qarz nazorati bitta ekranda.">
      {error ? <div className="mb-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat icon={Wallet} label="Bugungi UZS kirim" value={money(data.todayPaymentsUZS || 0, "UZS")} />
        <Stat icon={Wallet} label="Bugungi USD kirim" value={money(data.todayPaymentsUSD || 0, "USD")} />
        <Stat icon={CreditCard} label="Jami to‘lovlar" value={`${num(data.paymentsCount || 0)} ta`} />
        <Stat icon={Banknote} label="USD qoldiq qarz" value={money(data.remainingUSD || 0, "USD")} />
      </div>

      <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        <ActionCard
          title="To‘lovlar"
          text="Kirimlar, qisman to‘lovlar, USD/UZS va mijozlar bo‘yicha tarix."
          href="/payments"
          icon={CreditCard}
          items={["Partial payment", "Cash / card / transfer", "Payment history"]}
        />
        <ActionCard
          title="Qarz Excel markazi"
          text="1C Excel import — qarzlar uchun yagona manba."
          href="/debts"
          icon={FileSpreadsheet}
          items={["Excel import", "Replace mode", "USD / UZS jami"]}
        />
        <ActionCard
          title="Cashflow / DDS"
          text="Kirim-chiqim, kassa, bank va rejalashtirilgan pul oqimi."
          href="/cashflow"
          icon={Banknote}
          items={["Kirim", "Chiqim", "Pul oqimi"]}
        />
      </div>

      <div className="premium-card mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Buxgalter checklist</p>
            <h2 className="mt-2 text-[24px] font-normal tracking-[-0.05em]">Kunlik yopish tartibi</h2>
          </div>
          <button onClick={load} className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[var(--line)] bg-[var(--card-2)] px-4 text-[13px] text-[var(--text)]">
            <RefreshCw size={16} /> Yangilash
          </button>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {[
            "1C Excel qarzlarni import qilish",
            "Bugungi to‘lovlarni tekshirish",
            "Kassa va bank qoldig‘ini solishtirish",
            "Hisobotni egaga yuborish",
          ].map((item) => (
            <div key={item} className="rounded-[18px] bg-[var(--card-2)] px-4 py-3 text-[13px] leading-5 text-[var(--text)]">
              {item}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <Icon size={18} className="text-[var(--blue)]" />
      <p className="mt-4 text-[12px] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-[23px] font-normal tracking-[-0.05em] text-[var(--text)]">{value}</p>
    </div>
  );
}

function ActionCard({ title, text, href, icon: Icon, items }: { title: string; text: string; href: string; icon: any; items: string[] }) {
  return (
    <Link href={href} className="premium-card block p-6 transition hover:-translate-y-0.5 hover:border-[var(--blue)]/35">
      <div className="flex items-start justify-between gap-4">
        <Icon size={23} className="text-[var(--blue)]" />
        <ArrowRight size={18} className="text-[var(--muted-2)]" />
      </div>
      <h2 className="mt-5 text-[24px] font-normal tracking-[-0.05em]">{title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{text}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[var(--card-2)] px-3 py-1.5 text-[12px] text-[var(--muted)]">{item}</span>
        ))}
      </div>
    </Link>
  );
}
