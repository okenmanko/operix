"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import LangSwitcher from "./LangSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { clearAuth } from "../lib/api";

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
      <section className="ml-[224px] min-h-screen px-7 py-6 max-lg:ml-0 max-lg:px-5 max-sm:px-4 max-sm:py-4">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-6 flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <h1 className="text-[34px] font-medium tracking-[-0.075em] text-[var(--text)] max-md:text-[28px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-md:w-full max-md:justify-start">
              <LangSwitcher />
              <ThemeSwitcher />
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/login";
                }}
                className="h-10 rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-3.5 text-[12px] font-normal text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                Chiqish
              </button>
            </div>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
