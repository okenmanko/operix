"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Boxes, Package, QrCode, RefreshCw, Warehouse } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { apiJson, money, num } from "../lib/api";

type Summary = {
  products?: number;
  warehouses?: number;
  totalQuantity?: number;
  totalValueUSD?: number;
  totalValue?: number;
  topWarehouses?: { id?: string; name?: string; totalQuantity?: number; productCount?: number; totalValueUSD?: number; totalValue?: number }[];
};

export default function SkladPage() {
  const [data, setData] = useState<Summary>({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setData(await apiJson<Summary>("/inventory/summary"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sklad yuklanmadi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Sklad" subtitle="MoySklad qoldiq, mahsulot, tannarx, sotuv narxi va omborlar bitta workspace ichida.">
      {error ? <div className="mb-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div> : null}

      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Stat icon={Package} label="Mahsulot turi" value={`${num(data.products || 0)} ta`} />
        <Stat icon={Warehouse} label="Omborlar" value={`${num(data.warehouses || 0)} ta`} />
        <Stat icon={Boxes} label="Jami qoldiq" value={`${num(data.totalQuantity || 0)} dona`} />
        <Stat icon={Boxes} label="Sklad qiymati" value={money(data.totalValueUSD || data.totalValue || 0, "USD")} />
      </div>

      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
        <ActionCard href="/products" icon={Package} title="Mahsulotlar" text="Nomi, SKU, barcode, tannarx, sotuv narxi, qoldiq va skladlar." />
        <ActionCard href="/warehouses" icon={Warehouse} title="Omborlar" text="Har bir ombor ichidagi tovarlar va qiymat." />
        <ActionCard href="/inventory" icon={Boxes} title="Inventory" text="Umumiy qoldiq, qiymat va tezkor nazorat." />
        <ActionCard href="/qr-labels" icon={QrCode} title="QR" text="QR label, scanner va dona-dona tracking." />
      </div>

      <div className="premium-card mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Sklad nazorati</p>
            <h2 className="mt-2 text-[24px] font-normal tracking-[-0.05em]">Top omborlar</h2>
          </div>
          <Link href="/integrations" className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-[#315efb] px-4 text-[13px] text-white">
            MoySklad sync <RefreshCw size={16} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {(data.topWarehouses || []).slice(0, 6).map((item, index) => (
            <div key={item.id || item.name || index} className="grid grid-cols-4 gap-3 rounded-[18px] bg-[var(--card-2)] px-4 py-3 text-[13px] max-lg:grid-cols-2 max-md:grid-cols-1">
              <span className="text-[var(--text)]">{item.name || "Ombor"}</span>
              <span className="text-[var(--muted)]">SKU: {num(item.productCount || 0)}</span>
              <span className="text-[var(--muted)]">Qoldiq: {num(item.totalQuantity || 0)} dona</span>
              <span className="text-[var(--text)]">{money(item.totalValueUSD || item.totalValue || 0, "USD")}</span>
            </div>
          ))}
          {!(data.topWarehouses || []).length ? (
            <p className="rounded-[18px] bg-[var(--card-2)] px-4 py-5 text-center text-[13px] text-[var(--muted)]">
              Hali ombor qoldiq sync qilinmagan. Integrations → Tovarlar → Omborlar → Qoldiq bosing.
            </p>
          ) : null}
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

function ActionCard({ href, icon: Icon, title, text }: { href: string; icon: any; title: string; text: string }) {
  return (
    <Link href={href} className="premium-card block p-6 transition hover:-translate-y-0.5 hover:border-[var(--blue)]/35">
      <div className="flex items-start justify-between gap-4">
        <Icon size={22} className="text-[var(--blue)]" />
        <ArrowRight size={18} className="text-[var(--muted-2)]" />
      </div>
      <h2 className="mt-5 text-[23px] font-normal tracking-[-0.05em]">{title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{text}</p>
    </Link>
  );
}
