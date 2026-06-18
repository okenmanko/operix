"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import LangSwitcher from "./LangSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { clearAuth } from "../lib/api";
import { LogOut, Menu } from "lucide-react";

export default function AppLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="premium-page min-h-screen text-[var(--text)]">
      <Sidebar />

      <section className="ml-[250px] min-h-screen px-8 py-6 max-lg:ml-0 max-lg:px-5 max-sm:px-4 max-sm:py-5">
        <div className="mx-auto max-w-[1420px]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="hidden items-center gap-3 max-lg:flex">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--blue-soft)] text-[var(--blue)]">
                <Menu size={18} />
              </div>
              <div>
                <p className="text-[18px] tracking-[-0.05em] text-[var(--text)]">QANOT</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-2)]">Business OS</p>
              </div>
            </Link>

            <div className="ml-auto flex flex-wrap items-center gap-3 max-sm:w-full">
              <LangSwitcher />
              <ThemeSwitcher />
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/login";
                }}
                className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-4 text-[13px] font-normal text-[var(--muted)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)] max-sm:flex-1 max-sm:justify-center"
              >
                <LogOut size={16} /> Chiqish
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
