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
  UsersRound,
} from "lucide-react";
import { useI18n } from "../lib/i18n";

const links = [
  { href: "/", labelKey: "dashboard", fallback: "Dashboard", icon: Home },
  { href: "/finance", labelKey: "finance", fallback: "Moliya", icon: CreditCard },
  { href: "/debts", labelKey: "debtors", fallback: "Qarzdorlar", icon: UsersRound },
  { href: "/sklad", labelKey: "warehouseOS", fallback: "Sklad", icon: Box },
  { href: "/sales", labelKey: "sales", fallback: "Sotuv", icon: ShoppingCart },
  { href: "/reports", labelKey: "reports", fallback: "Hisobot", icon: BarChart3 },
  { href: "/settings", labelKey: "settings", fallback: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[216px] flex-col border-r border-[var(--line)] bg-[var(--card)] px-4 py-5 max-lg:static max-lg:h-auto max-lg:w-full max-lg:border-b max-lg:border-r-0">
      <Link href="/" className="mb-7 flex items-center gap-3 rounded-[18px] px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[var(--blue-soft)] text-[var(--blue)]">
          <span className="text-[15px] font-semibold tracking-[-0.06em]">q</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[21px] font-semibold leading-none tracking-[-0.075em] text-[var(--text)]">
            qanot
          </h1>
        </div>
      </Link>

      <nav className="space-y-1 max-lg:flex max-lg:overflow-x-auto max-lg:pb-2">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex h-10 items-center gap-3 rounded-[14px] px-3 text-[13px] font-medium tracking-[-0.01em] transition max-lg:min-w-max ${
                active
                  ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={17} strokeWidth={1.85} />
              <span>{t(item.labelKey, item.fallback)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
