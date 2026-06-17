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
      <section className="ml-[250px] min-h-screen px-10 py-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-5 flex justify-end gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="h-11 rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-4 text-[13px] font-normal text-[var(--muted)] shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
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
