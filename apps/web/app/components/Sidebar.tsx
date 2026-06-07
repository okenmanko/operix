import Link from "next/link";
import { Home, Users, Wallet, CreditCard, BarChart3, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Mijozlar", icon: Users },
  { href: "/debts", label: "Qarzlar", icon: Wallet },
  { href: "/payments", label: "To‘lovlar", icon: CreditCard },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[230px] border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          <img src="/logo.png" alt="Operix" className="h-full w-full object-contain" />
        </div>

        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-950">
            Operix
          </h1>
          <p className="text-[11px] font-medium text-slate-400">CRM</p>
        </div>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Icon size={17} strokeWidth={1.8} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}