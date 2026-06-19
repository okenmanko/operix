"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import ThemeSwitcher from "./ThemeSwitcher";
import { clearAuth } from "../lib/api";
import { useI18n } from "../lib/i18n";

export default function AppLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <main className="premium-page min-h-screen text-[var(--text)]">
      <Sidebar />
      <section className="ml-[220px] min-h-screen px-9 py-8 max-lg:ml-0 max-lg:px-4">
        <div className="mx-auto max-w-[1520px]">
          <div className="mb-5 flex justify-end gap-3 no-print">
            <ThemeSwitcher />
            <button onClick={() => { clearAuth(); window.location.href = "/login"; }} className="premium-button premium-button-soft">
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
