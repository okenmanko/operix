"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
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
  { href: "/sklad", label: "Sklad", icon: Boxes },
  { href: "/sales", label: "Sotuv", icon: ShoppingCart },
  { href: "/reports", label: "Hisobot", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-[224px] border-r border-[var(--line)] bg-[var(--card)]/96 px-4 py-5 shadow-[8px_0_32px_rgba(15,23,42,0.025)] backdrop-blur-xl max-lg:static max-lg:h-auto max-lg:w-full max-lg:border-b max-lg:border-r-0">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[var(--blue-soft)] text-[17px] text-[var(--blue)]">
          ᵠ
        </div>
        <h1 className="text-[22px] font-medium lowercase tracking-[-0.075em] text-[var(--text)]">
          qanot
        </h1>
      </div>

      <nav className="operix-scrollbar flex h-[calc(100vh-94px)] flex-col gap-1 overflow-y-auto pr-1 max-lg:h-auto max-lg:flex-row max-lg:overflow-x-auto max-lg:pb-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 min-w-fit items-center gap-2.5 rounded-[14px] px-3 text-[13px] font-normal transition ${
                active
                  ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
