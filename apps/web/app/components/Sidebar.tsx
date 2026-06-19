"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Box, CreditCard, Home, Settings, ShoppingCart, Users } from "lucide-react";
import { useI18n } from "../lib/i18n";

const links = [
  { href: "/", key: "dashboard", icon: Home },
  { href: "/finance", key: "finance", icon: CreditCard },
  { href: "/debts", key: "debts", icon: Users },
  { href: "/sklad", key: "sklad", icon: Box },
  { href: "/sales", key: "sales", icon: ShoppingCart },
  { href: "/reports", key: "reports", icon: BarChart3 },
  { href: "/settings", key: "settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[220px] border-r border-[var(--line)] bg-[var(--card)]/96 px-4 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.03)] backdrop-blur-xl max-lg:hidden">
      <Link href="/" className="mb-9 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--blue-soft)] text-[var(--blue)] text-[15px] font-bold">q</div>
        <h1 className="text-[22px] font-bold tracking-[-0.06em] text-[var(--text)]">qanot</h1>
      </Link>

      <nav className="space-y-1.5">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-[16px] px-3.5 text-[14px] font-medium transition ${active ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"}`}
            >
              <Icon size={17} strokeWidth={1.9} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
