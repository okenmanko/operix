"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
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
    <main className="premium-page min-h-screen text-[#111827]">
      <Sidebar />
      <section className="ml-[250px] min-h-screen px-10 py-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-5 flex justify-end">
            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="h-11 rounded-[16px] border border-[#e7edf5] bg-white px-4 text-[13px] font-normal text-[#6d7b90] shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition hover:bg-[#eef4ff] hover:text-[#315efb]"
            >
              Chiqish
            </button>
          </div>

          <PageHeader title={title} subtitle={subtitle} />
          {children}
        </div>
      </section>
    </main>
  );
}
