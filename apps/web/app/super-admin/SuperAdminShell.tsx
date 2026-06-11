"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CreditCard, LayoutDashboard, LogOut, Package, Settings } from "lucide-react";
import { logout } from "../lib/api";

const links = [
  { href: "/super-admin", label: "Kompaniyalar", icon: Building2 },
  { href: "/super-admin/plans", label: "Tariflar", icon: Package },
  { href: "/super-admin/billing", label: "Billing", icon: CreditCard },
  { href: "/super-admin/modules", label: "Modullar", icon: LayoutDashboard },
  { href: "/super-admin/settings", label: "Sozlamalar", icon: Settings },
];

export default function SuperAdminShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <aside className="fixed left-0 top-0 z-30 h-screen w-[260px] border-r border-slate-200 bg-white px-5 py-6">
        <div className="mb-8 flex items-center gap-3 rounded-[22px] bg-slate-950 px-4 py-4 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-[-0.04em]">Operix</p>
            <p className="text-[11px] font-semibold text-slate-400">Super Admin</p>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold transition ${
                  active ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="absolute bottom-6 left-5 right-5 flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-[14px] font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} /> Chiqish
        </button>
      </aside>

      <main className="ml-[260px] min-h-screen px-9 py-8">
        <header className="mb-7 flex items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-sky-600">Platform Control</p>
            <h1 className="text-[38px] font-bold tracking-[-0.06em] text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-2 text-[15px] font-semibold text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-bold text-slate-700 shadow-sm">
            Faqat SUPER_ADMIN
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
