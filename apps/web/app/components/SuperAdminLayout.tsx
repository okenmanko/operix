"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { clearAuth } from "../lib/api";

const links = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/companies", label: "Kompaniyalar", icon: Building2 },
  { href: "/super-admin/users", label: "Userlar", icon: Users },
  { href: "/super-admin/billing", label: "Billing", icon: CreditCard },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAuth();
    router.replace("/super-login");
  }

  return (
    <main className="premium-page min-h-screen text-[#111827]">
      <aside className="fixed left-0 top-0 z-20 h-screen w-[250px] border-r border-[#e7edf5] bg-white/92 px-5 py-6 shadow-[10px_0_40px_rgba(15,23,42,0.025)] backdrop-blur-xl">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#315efb]">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[18px] font-normal tracking-[-0.035em] text-[#111827]">
              Operix
            </h1>
            <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.22em] text-[#8aa0ba]">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="space-y-1.5">
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
                className={`flex h-12 items-center gap-3 rounded-[18px] px-4 text-[14px] font-normal transition ${
                  active
                    ? "border border-[#d9e6ff] bg-[#eef4ff] text-[#315efb]"
                    : "text-[#64748b] hover:bg-[#f5f8fc] hover:text-[#111827]"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="absolute bottom-6 left-5 right-5 flex h-12 items-center justify-center gap-2 rounded-[18px] border border-[#e7edf5] bg-[#f8fafc] text-[14px] font-normal text-[#637083] transition hover:bg-[#eef4ff] hover:text-[#315efb]"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Chiqish
        </button>
      </aside>

      <section className="ml-[250px] min-h-screen px-10 py-8">
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </section>
    </main>
  );
}
