"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  CreditCard,
  Home,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", sub: "Owner OS", icon: Home },
  { href: "/finance", label: "Moliya", sub: "Kassa • Bank", icon: CreditCard },
  { href: "/debts", label: "Qarzdorlar", sub: "Excel • To‘lov", icon: Users },
  { href: "/sklad", label: "Sklad", sub: "Tovar • Ombor", icon: Box },
  { href: "/sales", label: "Sotuv", sub: "POS • Tarix", icon: ShoppingCart },
  { href: "/reports", label: "Hisobot", sub: "Grafik • Profit", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", sub: "Company • Role", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[250px] flex-col border-r border-[var(--line)] bg-[var(--card)]/96 px-5 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.03)] backdrop-blur-xl max-lg:hidden">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[var(--blue-soft)] text-[var(--blue)]">
          <span className="text-[22px] leading-none">✦</span>
        </div>
        <div>
          <h1 className="text-[21px] font-normal tracking-[-0.06em] text-[var(--text)]">
            QANOT
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-2)]">
            Business OS
          </p>
        </div>
      </Link>

      <div className="mb-5 rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Bugungi fokus</p>
        <p className="mt-2 text-[14px] leading-5 text-[var(--text)]">
          Pul, qarz va skladni bitta joyda nazorat qiling.
        </p>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-[54px] items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-[13px] font-normal transition ${
                active
                  ? "border border-[var(--blue)]/25 bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="min-w-0">
                <span className="block text-[14px] leading-4">{item.label}</span>
                <span className="mt-1 block truncate text-[10px] text-[var(--muted-2)]">{item.sub}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-2)]">Qanot AI</p>
        <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
          Keyingi sprint: Risk Center va AI Director.
        </p>
      </div>
    </aside>
  );
}
