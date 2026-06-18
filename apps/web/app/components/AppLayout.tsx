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

      <section className="ml-[220px] min-h-screen px-7 py-5 max-lg:ml-0 max-lg:px-5 max-sm:px-4 max-sm:py-5">
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="hidden items-center gap-3 max-lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--blue-soft)] text-[var(--blue)]">
                <Menu size={17} />
              </div>
              <p className="text-[23px] lowercase leading-none tracking-[-0.08em] text-[var(--text)]">qanot</p>
            </Link>

            <div className="ml-auto flex flex-wrap items-center gap-3 max-sm:w-full">
              <LangSwitcher />
              <ThemeSwitcher />
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/login";
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[15px] border border-[var(--line)] bg-[var(--card)] px-4 text-[13px] font-normal text-[var(--muted)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)] max-sm:flex-1 max-sm:justify-center"
              >
                <LogOut size={15} /> Chiqish
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
