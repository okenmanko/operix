"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { clearAuth } from "../lib/api";

const links = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/companies", label: "Kompaniyalar", icon: Building2 },
  { href: "/super-admin/users", label: "Userlar", icon: Users },
  { href: "/super-admin/billing", label: "Billing", icon: CreditCard },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAuth();
    router.replace("/super-login");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <aside className="fixed left-0 top-0 z-20 h-screen w-[260px] border-r border-slate-200 bg-white px-5 py-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Operix</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/super-admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="absolute bottom-6 left-5 right-5 flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </aside>

      <section className="ml-[260px] min-h-screen px-10 py-8">
        {children}
      </section>
    </main>
  );
}
