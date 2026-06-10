"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";

export default function SuperAdminSettingsPage() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");

  useEffect(() => {
    setTheme(localStorage.getItem("operix_theme") || "light");
    setLang(localStorage.getItem("operix_lang") || "uz");
  }, []);

  function saveTheme(value: string) {
    setTheme(value);
    localStorage.setItem("operix_theme", value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }

  function saveLang(value: string) {
    setLang(value);
    localStorage.setItem("operix_lang", value);
  }

  return (
    <AppLayout title="Admin sozlamalar" subtitle="Super Admin uchun umumiy sozlamalar">
      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] dark:text-white">Til</h2>
          <p className="mt-1 text-sm text-slate-400">Interfeys tili</p>
          <select value={lang} onChange={(e) => saveLang(e.target.value)} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
            <option value="uz">Uzbek</option>
            <option value="ru">Русский</option>
          </select>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] dark:text-white">Rejim</h2>
          <p className="mt-1 text-sm text-slate-400">Kunduzgi yoki tungi ko‘rinish</p>
          <select value={theme} onChange={(e) => saveTheme(e.target.value)} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
            <option value="light">Kunduzgi</option>
            <option value="dark">Tungi</option>
          </select>
        </div>
      </div>
    </AppLayout>
  );
}
