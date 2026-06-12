"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  CircleDollarSign,
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
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Mijozlar", icon: Users },
  { href: "/debts", label: "Qarzlar", icon: ClipboardList },
  { href: "/payments", label: "To‘lovlar", icon: CreditCard },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/products", label: "Products", icon: Package },
  { href: "/warehouses", label: "Omborlar", icon: Warehouse },
  { href: "/stock", label: "Stock", icon: Building2 },
  { href: "/qr-labels", label: "QR Labels", icon: QrCode },
  { href: "/sales", label: "Sales / POS", icon: ShoppingCart },
  { href: "/cashflow", label: "DDS", icon: Wallet },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/hr", label: "HR", icon: CalendarClock },
  { href: "/billing", label: "Billing", icon: ReceiptText },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-[250px] border-r border-[#e7edf5] bg-white/92 px-5 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.025)] backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#315efb]">
          <span className="h-3.5 w-3.5 rounded-[6px] bg-[#315efb]" />
        </div>
        <div>
          <h1 className="text-[18px] font-normal tracking-[-0.035em] text-[#111827]">
            Operix
          </h1>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.22em] text-[#8aa0ba]">
            Business OS
          </p>
        </div>
      </div>

      <nav className="h-[calc(100vh-120px)] space-y-1.5 overflow-y-auto pr-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-[16px] px-3.5 text-[13px] font-normal transition ${
                active
                  ? "border border-[#d9e6ff] bg-[#eef4ff] text-[#315efb]"
                  : "text-[#64748b] hover:bg-[#f5f8fc] hover:text-[#111827]"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
