"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  Truck,
  Package,
  Warehouse,
  QrCode,
  ArrowLeftRight,
  Banknote,
  ShoppingCart,
  LineChart,
} from "lucide-react";

const groups = [
  {
    title: "STARTER",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/clients", label: "Mijozlar", icon: Users },
      { href: "/debts", label: "Qarzlar", icon: Wallet },
      { href: "/payments", label: "To‘lovlar", icon: CreditCard },
      { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { href: "/analytics", label: "Analytics", icon: LineChart },
      { href: "/delivery", label: "Delivery", icon: Truck },
      { href: "/inventory", label: "Sklad", icon: Package },
      { href: "/warehouses", label: "Skladlar", icon: Warehouse },
      { href: "/products", label: "QR kodlar", icon: QrCode },
      { href: "/qr-scanner", label: "QR Scanner", icon: QrCode },
      { href: "/stock-movements", label: "Harakatlar", icon: ArrowLeftRight },
    ],
  },
  {
    title: "PRO",
    items: [
      { href: "/sales", label: "Sotuv POS", icon: ShoppingCart },
      { href: "/cashflow", label: "DDS", icon: Banknote },
    ],
  },
];

function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("operix_token");
  localStorage.removeItem("token");
  localStorage.removeItem("operix_user");
  localStorage.removeItem("operix_company");
  document.cookie = "operix_token=; path=/; max-age=0; SameSite=Lax";
  window.location.href = "/login";
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[230px] flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          <img src="/logo.png" alt="Operix" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-950">Operix</h1>
          <p className="text-[11px] font-bold text-slate-400">BUSINESS OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-semibold transition ${
                      active ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-white" : "text-slate-500"} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-semibold transition ${
            pathname === "/settings" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          <Settings size={17} strokeWidth={pathname === "/settings" ? 2.2 : 1.8} className={pathname === "/settings" ? "text-white" : "text-slate-500"} />
          Sozlamalar
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[14px] font-bold text-red-600 transition hover:bg-red-50"
        >
          Chiqish
        </button>
      </div>
    </aside>
  );
}
