"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import LangSwitcher from "./LangSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { clearAuth } from "../lib/api";
import { useI18n } from "../lib/i18n";

const mobileLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Moliya" },
  { href: "/debts", label: "Qarz" },
  { href: "/sklad", label: "Sklad" },
  { href: "/sales", label: "Sotuv" },
  { href: "/reports", label: "Hisobot" },
];

export default function AppLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <main className="premium-page min-h-screen text-[var(--text)]">
      <Sidebar />

      <div className="sticky top-0 z-20 hidden border-b border-[var(--line)] bg-[var(--bg)]/88 px-4 py-3 backdrop-blur-xl max-lg:block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[var(--blue)] text-[15px] text-white">q</span>
            <span className="text-[22px] font-medium lowercase tracking-[-0.08em]">qanot</span>
          </Link>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mobileLinks.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[12px] text-[var(--muted)]">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="ml-[218px] min-h-screen px-7 py-6 max-lg:ml-0 max-lg:px-4 max-sm:px-3 max-sm:py-4">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-5 flex items-center justify-between gap-4 max-lg:hidden">
            <div className="text-[12px] text-[var(--muted)]">Business OS</div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <ThemeSwitcher />
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/login";
                }}
                className="h-10 rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-4 text-[12px] text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                {t("logout")}
              </button>
            </div>
          </div>

          <PageHeader title={title} subtitle={subtitle} />
          {children}
        </div>
      </section>
    </main>
  );
}
