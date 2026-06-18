"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { useI18n } from "../lib/i18n";

const mainLinks = [
  { href: "/", labelKey: "dashboard", fallback: "Dashboard", icon: Home },
  { href: "/finance", labelKey: "finance", fallback: "Moliya", icon: Wallet },
  { href: "/debts", labelKey: "debtors", fallback: "Qarzdorlar", icon: Users },
  { href: "/sklad", labelKey: "warehouse", fallback: "Sklad", icon: Package },
  { href: "/sales", labelKey: "sales", fallback: "Sotuv", icon: ShoppingCart },
  { href: "/reports", labelKey: "reports", fallback: "Hisobot", icon: BarChart3 },
  { href: "/settings", labelKey: "settings", fallback: "Sozlamalar", icon: Settings },
];

const hiddenRoutes: Record<string, string[]> = {
  "/finance": ["/payments", "/cashflow", "/dds"],
  "/debts": ["/clients", "/overdue"],
  "/sklad": ["/inventory", "/products", "/warehouses", "/stock-movements", "/qr-labels", "/qr-scanner"],
  "/sales": ["/pos", "/sales"],
  "/reports": ["/analytics", "/bi"],
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (hiddenRoutes[href] || []).some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[218px] border-r border-[var(--line)] bg-[var(--sidebar)] px-4 py-5 text-[var(--text)] max-lg:hidden">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[var(--blue)] text-[15px] text-white shadow-[0_12px_28px_rgba(49,94,251,0.24)]">
          q
        </span>
        <span className="text-[23px] font-medium lowercase tracking-[-0.08em] text-[var(--text)]">
          qanot
        </span>
      </Link>

      <nav className="space-y-1">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex h-10 items-center gap-3 rounded-[14px] px-3 text-[13px] transition ${
                active
                  ? "bg-[var(--active)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} className="shrink-0" />
              <span className="truncate">{t(item.labelKey, item.fallback)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
