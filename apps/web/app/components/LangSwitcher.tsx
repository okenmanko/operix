"use client";

import { LANGS, useI18n, type Lang } from "../lib/i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex h-10 items-center rounded-[15px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)] transition">
      {LANGS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setLang(item.value as Lang)}
          className={`h-8 rounded-[12px] px-3 text-[12px] font-medium transition ${
            lang === item.value
              ? "qanot-primary text-white"
              : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
