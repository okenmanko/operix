"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import ThemeSwitcher from "./ThemeSwitcher";
import { clearAuth } from "../lib/api";
import { useI18n } from "../lib/i18n";

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
    <main className="qanot-page min-h-screen text-[var(--text)]">
      <Sidebar />

      <section className="ml-[216px] min-h-screen px-8 py-7 max-lg:ml-0 max-lg:px-5 max-sm:px-4 max-sm:py-5">
        <div className="mx-auto max-w-[1420px]">
          <div className="mb-7 flex items-start justify-between gap-5 max-md:flex-col">
            <div className="min-w-0">
              <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.075em] text-[var(--text)] max-sm:text-[28px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-[var(--muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-start">
              <ThemeSwitcher />
              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/login";
                }}
                className="qanot-button qanot-button-soft h-10 min-h-10 px-4 text-[13px] max-sm:flex-1"
              >
                {t("logout")}
              </button>
            </div>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
