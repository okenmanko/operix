"use client";

import { useI18n } from "../lib/i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={() => setLang("uz")}
        className={`rounded-xl px-4 py-2 text-[13px] font-bold transition ${
          lang === "uz"
            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
            : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        UZ
      </button>
      <button
        type="button"
        onClick={() => setLang("ru")}
        className={`rounded-xl px-4 py-2 text-[13px] font-bold transition ${
          lang === "ru"
            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
            : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        }`}
      >
        RU
      </button>
    </div>
  );
}
