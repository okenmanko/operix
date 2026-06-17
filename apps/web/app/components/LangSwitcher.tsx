"use client";

import { LANGS, useI18n, type Lang } from "../lib/i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex h-11 items-center rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-1 shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition">
      {LANGS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setLang(item.value as Lang)}
          className={`h-9 rounded-[13px] px-3 text-[12px] font-normal transition ${
            lang === item.value
              ? "bg-[var(--blue)] text-white shadow-[0_10px_20px_rgba(49,94,251,0.16)]"
              : "text-[var(--muted)] hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
