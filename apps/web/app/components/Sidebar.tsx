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
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/finance", label: "Moliya", icon: CreditCard },
  { href: "/debts", label: "Qarzdorlar", icon: Users },
  { href: "/sklad", label: "Sklad", icon: Box },
  { href: "/sales", label: "Sotuv", icon: ShoppingCart },
  { href: "/reports", label: "Hisobot", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[220px] flex-col border-r border-[var(--line)] bg-[var(--card)]/96 px-4 py-5 shadow-[10px_0_40px_rgba(15,23,42,0.025)] backdrop-blur-xl max-lg:hidden">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--blue-soft)] text-[var(--blue)]">
          <span className="text-[17px] leading-none">✦</span>
        </div>
        <h1 className="text-[24px] font-normal lowercase leading-none tracking-[-0.08em] text-[var(--text)]">
          qanot
        </h1>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex h-11 items-center gap-3 rounded-[15px] px-3 text-[13px] font-normal transition ${
                active
                  ? "border border-[var(--blue)]/25 bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
