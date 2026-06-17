"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  QrCode,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  ArrowLeftRight,
} from "lucide-react";
import { useI18n } from "../lib/i18n";

const links = [
  { href: "/", labelKey: "dashboard", fallback: "Dashboard", icon: Home },
  { href: "/clients", labelKey: "clients", fallback: "Mijozlar", icon: Users },
  { href: "/debts", labelKey: "debts", fallback: "Qarzlar", icon: ClipboardList },
  { href: "/payments", labelKey: "payments", fallback: "To‘lovlar", icon: CreditCard },
  { href: "/reports", labelKey: "reports", fallback: "Hisobotlar", icon: BarChart3 },
  { href: "/analytics", labelKey: "analytics", fallback: "Analytics", icon: BarChart3 },
  { href: "/inventory", labelKey: "inventory", fallback: "Inventory", icon: Boxes },
  { href: "/products", labelKey: "products", fallback: "Products", icon: Package },
  { href: "/warehouses", labelKey: "warehouses", fallback: "Omborlar", icon: Warehouse },
  { href: "/stock-movements", labelKey: "movements", fallback: "Stock Movement", icon: ArrowLeftRight },
  { href: "/qr-labels", labelKey: "qrCodes", fallback: "QR Labels", icon: QrCode },
  { href: "/sales", labelKey: "sales", fallback: "Sales / POS", icon: ShoppingCart },
  { href: "/cashflow", labelKey: "cashflow", fallback: "DDS", icon: Wallet },
  { href: "/delivery", labelKey: "delivery", fallback: "Delivery", icon: Truck },
  { href: "/hr", labelKey: "hr", fallback: "HR", icon: CalendarClock },
  { href: "/billing", labelKey: "billing", fallback: "Billing", icon: ReceiptText },
  { href: "/settings", labelKey: "settings", fallback: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-[250px] border-r border-[var(--line)] bg-[var(--card)]/95 px-5 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.025)] backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--blue-soft)] text-[var(--blue)]">
          <span className="h-3.5 w-3.5 rounded-[6px] bg-[var(--blue)]" />
        </div>
        <div>
          <h1 className="text-[18px] font-normal tracking-[-0.035em] text-[var(--text)]">
            Operix
          </h1>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.22em] text-[var(--muted-2)]">
            {t("businessOS")}
          </p>
        </div>
      </div>

      <nav className="h-[calc(100vh-120px)] space-y-1.5 overflow-y-auto pr-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-[16px] px-3.5 text-[13px] font-normal transition ${
                active
                  ? "border border-[var(--blue-line)] bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              {t(item.labelKey, item.fallback)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
