"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import LangSwitcher from "./LangSwitcher";
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
    <main className="premium-page min-h-screen text-[var(--text)]">
      <Sidebar />
      <section className="ml-[250px] min-h-screen px-10 py-8 max-lg:ml-0 max-lg:px-5 max-sm:px-4 max-sm:py-5">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-5 flex flex-wrap justify-end gap-3 max-sm:justify-start">
            <LangSwitcher />
            <ThemeSwitcher />
            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="h-11 rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-4 text-[13px] font-normal text-[var(--muted)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)] max-sm:flex-1"
            >
              {t("logout")}
            </button>
          </div>

          <PageHeader title={title} subtitle={subtitle} />
          {children}
        </div>
      </section>
    </main>
  );
}
